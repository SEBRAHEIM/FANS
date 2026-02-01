'use client'

import { useState } from 'react'
import { Plus, X, Type, List, Edit3, Save, Trash2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface QuizCreatorProps {
    moduleId: string
    moduleTitle: string
    moduleType: string
    isOpen: boolean
    onClose: () => void
}

interface Question {
    text: string
    type: 'multiple_choice' | 'multiple_selection' | 'fill_blanks' | 'written'
    options: string[]
    correctAnswers: string[] // Changed to array for multi-select
    timestampSeconds?: number
}

export default function QuizCreator({ moduleId, moduleTitle, moduleType, isOpen, onClose }: QuizCreatorProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    const addQuestion = () => {
        setQuestions([...questions, { text: '', type: 'multiple_choice', options: ['', ''], correctAnswers: [] }])
    }

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], ...updates }
        setQuestions(newQuestions)
    }

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index))
    }

    const toggleCorrectAnswer = (qIdx: number, opt: string) => {
        const q = questions[qIdx]
        let newCorrect: string[] = []

        if (q.type === 'multiple_choice') {
            newCorrect = [opt]
        } else {
            newCorrect = q.correctAnswers.includes(opt)
                ? q.correctAnswers.filter(a => a !== opt)
                : [...q.correctAnswers, opt]
        }

        updateQuestion(qIdx, { correctAnswers: newCorrect })
    }

    async function handleSave() {
        setLoading(true)

        const formattedQuestions = questions.map((q, idx) => ({
            module_id: moduleId,
            question_text: q.text,
            question_type: q.type,
            options: (q.type === 'multiple_choice' || q.type === 'multiple_selection') ? q.options : null,
            correct_answer: q.type === 'multiple_selection' ? q.correctAnswers.join('|') : q.correctAnswers[0] || '',
            order_index: idx + 1
        }))

        const { data: questionData, error: qError } = await supabase
            .from('quiz_questions')
            .insert(formattedQuestions)
            .select()

        if (qError) {
            alert('Error saving questions: ' + qError.message)
        } else if (moduleType === 'video' || moduleType === 'live') {
            // Save as checkpoints
            const checkpoints = questions.map((q, idx) => ({
                module_id: moduleId,
                timestamp_seconds: q.timestampSeconds || 0,
                question_id: questionData?.[idx].id,
                is_blocking: true
            }))

            const { error: cError } = await supabase
                .from('module_checkpoints')
                .insert(checkpoints)

            if (cError) alert('Error saving checkpoints: ' + cError.message)
            else onClose()
        } else {
            onClose()
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                <header className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">QUIZ ENGINE</h3>
                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-1">Configuring: {moduleTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-8 relative group">
                            <button
                                onClick={() => removeQuestion(idx)}
                                className="absolute top-8 right-8 text-zinc-700 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <div className="flex items-start gap-6">
                                <span className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500">{idx + 1}</span>
                                <div className="flex-1 space-y-6">
                                    {moduleType === 'video' && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Video Timestamp (Seconds)</label>
                                            <input
                                                type="number"
                                                value={q.timestampSeconds || 0}
                                                onChange={(e) => updateQuestion(idx, { timestampSeconds: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm font-bold text-blue-500 focus:outline-none focus:border-blue-500 transition-all"
                                                placeholder="e.g. 15 for 0:15"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Question Type</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { id: 'multiple_choice', label: 'Single Choice', icon: List },
                                                { id: 'multiple_selection', label: 'Multi Select', icon: CheckCircle2 },
                                                { id: 'fill_blanks', label: 'Fill Blanks', icon: Type },
                                                { id: 'written', label: 'Written', icon: Edit3 }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => updateQuestion(idx, { type: type.id as any, correctAnswers: [] })}
                                                    className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${q.type === type.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                                >
                                                    <type.icon className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Question Prompt</label>
                                        <input
                                            value={q.text}
                                            onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                                            placeholder="What is the minimum separation for...?"
                                        />
                                    </div>

                                    {(q.type === 'multiple_choice' || q.type === 'multiple_selection') && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Options & Correct Selection</label>
                                                {q.type === 'multiple_selection' && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Select multiple correct answers</span>}
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex gap-3">
                                                        <input
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...q.options]
                                                                const oldVal = newOpts[optIdx]
                                                                newOpts[optIdx] = e.target.value
                                                                const newCorrect = q.correctAnswers.map(a => a === oldVal ? e.target.value : a)
                                                                updateQuestion(idx, { options: newOpts, correctAnswers: newCorrect })
                                                            }}
                                                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                                                            placeholder={`Option ${optIdx + 1}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCorrectAnswer(idx, opt)}
                                                            className={`p-4 rounded-xl border transition-all ${q.correctAnswers.includes(opt) && opt !== '' ? 'bg-emerald-600 border-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-700 hover:text-emerald-500'}`}
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuestion(idx, { options: [...q.options, ''] })}
                                                    className="w-full border-2 border-dashed border-zinc-800 text-zinc-700 hover:border-zinc-700 hover:text-zinc-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Add Option
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {q.type === 'fill_blanks' && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Correct Required Phrase(s)</label>
                                            <input
                                                value={q.correctAnswers[0] || ''}
                                                onChange={(e) => updateQuestion(idx, { correctAnswers: [e.target.value] })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                                                placeholder="e.g. Cleared for takeoff, Line up and wait"
                                            />
                                        </div>
                                    )}

                                    {q.type === 'written' && (
                                        <div className="p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
                                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] text-center leading-relaxed">System will allow free-text entry. Training Officers must manually grade these responses later.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full border-2 border-dashed border-zinc-800 hover:border-blue-500/50 text-zinc-700 hover:text-blue-500 p-10 rounded-[2rem] transition-all flex flex-col items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Add Question</span>
                    </button>
                </div>

                <footer className="p-8 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                    <button onClick={onClose} className="text-zinc-500 font-bold hover:text-white transition-colors">Discard Draft</button>
                    <button
                        disabled={questions.length === 0 || loading}
                        onClick={handleSave}
                        className="bg-zinc-100 text-zinc-950 px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Quiz Structure
                    </button>
                </footer>
            </div>
        </div>
    )
}

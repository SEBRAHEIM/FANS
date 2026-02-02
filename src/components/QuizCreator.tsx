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
    moduleVideos?: { id: string, url: string, title: string, source: string }[]
}

interface Question {
    text: string
    type: 'multiple_choice' | 'multiple_selection' | 'fill_blanks' | 'written'
    options: string[]
    correctAnswers: string[]
    timing: 'interactive' | 'final'
    targetVideoId?: string
    timestampSeconds?: number
    needsManualGrading?: boolean
}

export default function QuizCreator({ moduleId, moduleTitle, moduleType, isOpen, onClose, moduleVideos = [] }: QuizCreatorProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    const addQuestion = () => {
        setQuestions([...questions, {
            text: '',
            type: 'multiple_choice',
            options: ['', ''],
            correctAnswers: [],
            timing: 'final',
            targetVideoId: moduleVideos[0]?.id
        }])
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
            order_index: idx + 1,
            needs_manual_grading: q.type === 'written' ? true : (q.needsManualGrading || false),
            timing: q.timing,
            target_video_id: q.timing === 'interactive' ? q.targetVideoId : null,
            timestamp_seconds: q.timing === 'interactive' ? q.timestampSeconds : null
        }))

        const { data: questionData, error: qError } = await supabase
            .from('quiz_questions')
            .insert(formattedQuestions)
            .select()

        if (qError) {
            alert('Error saving questions: ' + qError.message)
        } else if (moduleType === 'video' || moduleType === 'live') {
            // Save interactive questions as checkpoints
            const checkpoints = questions
                .filter(q => q.timing === 'interactive')
                .map((q, idx) => ({
                    module_id: moduleId,
                    video_id: q.targetVideoId,
                    timestamp_seconds: q.timestampSeconds || 0,
                    question_id: questionData?.[idx].id,
                    is_blocking: true
                }))

            if (checkpoints.length > 0) {
                const { error: cError } = await supabase
                    .from('module_checkpoints')
                    .insert(checkpoints)

                if (cError) alert('Error saving checkpoints: ' + cError.message)
                else onClose()
            } else {
                onClose()
            }
        } else {
            onClose()
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center md:p-4">
            <div className="absolute inset-0 bg-black/95 md:backdrop-blur-2xl" onClick={onClose} />

            <div className="relative w-full h-full md:h-auto md:max-w-4xl md:max-h-[85vh] bg-zinc-950 md:bg-zinc-900 border-0 md:border border-zinc-800 md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                <header className="p-5 md:p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-950 md:bg-zinc-900/50 flex-shrink-0">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none">QUIZ ENGINE</h3>
                        <p className="text-zinc-500 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mt-1.5 line-clamp-1">{moduleTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 md:p-3 bg-zinc-900 md:bg-transparent border border-zinc-800 md:border-none rounded-xl md:rounded-2xl transition-all hover:bg-zinc-800">
                        <X className="w-5 h-5 md:w-6 h-6 text-zinc-500" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 md:space-y-10 no-scrollbar">
                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-zinc-950 md:bg-zinc-900/30 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 md:p-8 space-y-6 md:space-y-8 relative group">
                            <button
                                onClick={() => removeQuestion(idx)}
                                className="absolute top-4 right-4 md:top-8 md:right-8 text-zinc-700 hover:text-red-500 transition-colors z-10"
                            >
                                <Trash2 className="w-4 h-4 md:w-5 h-5" />
                            </button>

                            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                                <span className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500 flex-shrink-0">{idx + 1}</span>
                                <div className="w-full space-y-6">
                                    {moduleType === 'video' && (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
                                                <button
                                                    onClick={() => updateQuestion(idx, { timing: 'final' })}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${q.timing === 'final' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                >
                                                    Final Quiz
                                                </button>
                                                <button
                                                    onClick={() => updateQuestion(idx, { timing: 'interactive' })}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${q.timing === 'interactive' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                >
                                                    Interactive
                                                </button>
                                            </div>

                                            {q.timing === 'interactive' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Target Video</label>
                                                        <select
                                                            value={q.targetVideoId}
                                                            onChange={(e) => updateQuestion(idx, { targetVideoId: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                                        >
                                                            {moduleVideos.map(v => (
                                                                <option key={v.id} value={v.id}>{v.title}</option>
                                                            ))}
                                                            {moduleVideos.length === 0 && <option value="">No videos in module</option>}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Timestamp (Seconds)</label>
                                                        <input
                                                            type="number"
                                                            value={q.timestampSeconds || 0}
                                                            onChange={(e) => updateQuestion(idx, { timestampSeconds: parseInt(e.target.value) })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-black text-blue-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                                                            placeholder="e.g. 15"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Question Type</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
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
                                                    className={`p-3 md:p-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${q.type === type.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                                                >
                                                    <type.icon className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Question Prompt</label>
                                        <textarea
                                            value={q.text}
                                            onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-5 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800 min-h-[100px] resize-none"
                                            placeholder="What is the minimum separation for...?"
                                        />
                                    </div>

                                    {(q.type === 'multiple_choice' || q.type === 'multiple_selection') && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Choices & Correct Answer</label>
                                                {q.type === 'multiple_selection' && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Multi-Select</span>}
                                            </div>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex gap-2 items-stretch group/opt">
                                                        <div className="flex-1 relative">
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...q.options]
                                                                    const oldVal = newOpts[optIdx]
                                                                    newOpts[optIdx] = e.target.value
                                                                    const newCorrect = q.correctAnswers.map(a => a === oldVal ? e.target.value : a)
                                                                    updateQuestion(idx, { options: newOpts, correctAnswers: newCorrect })
                                                                }}
                                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 md:p-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                                                                placeholder={`Option ${optIdx + 1}`}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCorrectAnswer(idx, opt)}
                                                            className={`px-4 md:px-5 rounded-xl border transition-all flex items-center justify-center ${q.correctAnswers.includes(opt) && opt !== '' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-950 border-zinc-800 text-zinc-800 hover:text-emerald-500'}`}
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                        {q.options.length > 2 && (
                                                            <button
                                                                onClick={() => {
                                                                    const newOpts = q.options.filter((_, i) => i !== optIdx)
                                                                    updateQuestion(idx, { options: newOpts })
                                                                }}
                                                                className="p-3 text-zinc-800 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuestion(idx, { options: [...q.options, ''] })}
                                                    className="w-full border border-dashed border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-500 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-zinc-950/20"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {q.type === 'fill_blanks' && (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Correct Required Phrase(s)</label>
                                                <input
                                                    value={q.correctAnswers[0] || ''}
                                                    onChange={(e) => updateQuestion(idx, { correctAnswers: [e.target.value] })}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                                                    placeholder="e.g. Cleared for takeoff..."
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => updateQuestion(idx, { needsManualGrading: !q.needsManualGrading })}
                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${q.needsManualGrading ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                                            >
                                                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-md border-2 flex items-center justify-center transition-all ${q.needsManualGrading ? 'bg-amber-500 border-amber-500' : 'border-zinc-800'}`}>
                                                    {q.needsManualGrading && <CheckCircle2 className="w-3 h-3 text-zinc-950" />}
                                                </div>
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none text-left">Require Training Officer Review</span>
                                            </button>
                                        </div>
                                    )}

                                    {q.type === 'written' && (
                                        <div className="p-4 md:p-8 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl md:rounded-2xl">
                                            <p className="text-zinc-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center leading-relaxed">System will allow free-text entry. Training Officers must manually grade these responses later.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full border-2 border-dashed border-zinc-800 hover:border-blue-500/50 text-zinc-800 hover:text-blue-500 p-6 md:p-10 rounded-2xl md:rounded-[2rem] transition-all flex flex-col items-center gap-3 md:gap-4 group bg-zinc-950/20"
                    >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                            <Plus className="w-5 h-5 md:w-6 h-6" />
                        </div>
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em]">Add Question Item</span>
                    </button>
                </div>

                <footer className="p-5 md:p-8 border-t border-zinc-800/50 bg-zinc-950 md:bg-zinc-900/50 flex flex-col md:flex-row gap-4 md:justify-between items-center flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-4 text-zinc-500 font-bold hover:text-white transition-colors text-xs uppercase tracking-widest order-2 md:order-1"
                    >
                        Discard
                    </button>
                    <button
                        disabled={questions.length === 0 || loading}
                        onClick={handleSave}
                        className="w-full md:w-auto bg-blue-600 text-white px-10 md:px-12 py-4 md:py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 order-1 md:order-2 shadow-xl shadow-blue-600/20"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Structure
                    </button>
                </footer>
            </div>
        </div>
    )
}

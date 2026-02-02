'use client'

import { useState } from 'react'
import { Plus, X, Type, List, Edit3, Save, Trash2, CheckCircle2, HelpCircle } from 'lucide-react'
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
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')

    const supabase = createClient()

    const addQuestion = () => {
        const newIdx = questions.length
        setQuestions([...questions, {
            text: '',
            type: 'multiple_choice',
            options: ['', ''],
            correctAnswers: [],
            timing: 'final',
            targetVideoId: moduleVideos[0]?.id
        }])
        setActiveQuestionIndex(newIdx)
        if (window.innerWidth < 768) setViewMode('editor')
    }

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], ...updates }
        setQuestions(newQuestions)
    }

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index)
        setQuestions(newQuestions)
        if (activeQuestionIndex >= newQuestions.length) {
            setActiveQuestionIndex(Math.max(0, newQuestions.length - 1))
        }
        if (newQuestions.length === 0) setViewMode('list')
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
            const checkpoints = questions
                .map((q, idx) => ({ q, idx }))
                .filter(item => item.q.timing === 'interactive')
                .map((item) => ({
                    module_id: moduleId,
                    video_id: item.q.targetVideoId,
                    timestamp_seconds: item.q.timestampSeconds || 0,
                    question_id: questionData?.[item.idx].id,
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

    const activeQ = questions[activeQuestionIndex]

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black sm:bg-black/95 sm:backdrop-blur-3xl" onClick={onClose} />

            <div className="relative w-full h-full sm:max-w-6xl sm:h-[85vh] bg-zinc-950 sm:bg-zinc-900 border-0 sm:border border-zinc-800 sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                <header className="p-5 sm:p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-950 sm:bg-zinc-900/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        {viewMode === 'editor' && questions.length > 0 && (
                            <button
                                onClick={() => setViewMode('list')}
                                className="sm:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white"
                            >
                                <X className="w-5 h-5 rotate-90" />
                            </button>
                        )}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <HelpCircle className="w-5 h-5 sm:w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">BUILDER</h3>
                            <p className="text-zinc-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-1 line-clamp-1">{moduleTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2.5 sm:p-3 bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl transition-all hover:bg-zinc-800 text-zinc-500">
                            <X className="w-5 h-5 sm:w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Left Sidebar - Question List */}
                    <div className={`absolute inset-0 sm:relative sm:w-1/3 border-r border-zinc-800/50 flex flex-col bg-zinc-950 sm:bg-zinc-950/20 z-10 transition-transform duration-300 ${viewMode === 'list' ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                            {questions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setActiveQuestionIndex(idx);
                                        if (window.innerWidth < 768) setViewMode('editor');
                                    }}
                                    className={`w-full p-4 rounded-2xl flex items-start gap-4 transition-all text-left group ${activeQuestionIndex === idx ? 'bg-blue-600 shadow-xl shadow-blue-600/10' : 'hover:bg-zinc-900/50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] flex-shrink-0 ${activeQuestionIndex === idx ? 'bg-white text-blue-600' : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${activeQuestionIndex === idx ? 'text-blue-100' : 'text-zinc-500'}`}>
                                            {q.type.replace('_', ' ')}
                                        </p>
                                        <p className={`text-xs font-medium truncate ${activeQuestionIndex === idx ? 'text-white' : 'text-zinc-400'}`}>
                                            {q.text || "Empty Question..."}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={addQuestion}
                                className="w-full p-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-blue-500/50 text-zinc-600 hover:text-blue-500 transition-all flex items-center justify-center gap-2 group mt-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Item</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-12 no-scrollbar bg-zinc-900/30">
                        {questions.length > 0 ? (
                            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black text-white tracking-tight uppercase">Question #{activeQuestionIndex + 1}</h4>
                                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Configuration Panel</p>
                                    </div>
                                    <button
                                        onClick={() => removeQuestion(activeQuestionIndex)}
                                        className="p-3 text-zinc-700 hover:text-red-500 transition-colors bg-zinc-950 border border-zinc-800 rounded-xl"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Timing & Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {moduleType === 'video' && (
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Delivery Timing</label>
                                            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
                                                <button
                                                    onClick={() => updateQuestion(activeQuestionIndex, { timing: 'final' })}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeQ.timing === 'final' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                >
                                                    Final
                                                </button>
                                                <button
                                                    onClick={() => updateQuestion(activeQuestionIndex, { timing: 'interactive' })}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeQ.timing === 'interactive' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                >
                                                    Interactive
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Logic Type</label>
                                        <select
                                            value={activeQ.type}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { type: e.target.value as any, correctAnswers: [] })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                        >
                                            <option value="multiple_choice">Single Choice</option>
                                            <option value="multiple_selection">Multi-Select</option>
                                            <option value="fill_blanks">Phrase Match</option>
                                            <option value="written">Written / Essay</option>
                                        </select>
                                    </div>
                                </div>

                                {activeQ.timing === 'interactive' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Link to Video</label>
                                            <select
                                                value={activeQ.targetVideoId}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, { targetVideoId: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 appearance-none"
                                            >
                                                {moduleVideos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Appearance Time (sec)</label>
                                            <input
                                                type="number"
                                                value={activeQ.timestampSeconds || 0}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, { timestampSeconds: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-black text-blue-500 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Question Prompt</label>
                                    <textarea
                                        value={activeQ.text}
                                        onChange={(e) => updateQuestion(activeQuestionIndex, { text: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 text-base font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800 min-h-[160px] resize-none shadow-inner leading-relaxed"
                                        placeholder="Enter the question text here..."
                                    />
                                </div>

                                {/* Answers Section */}
                                {(activeQ.type === 'multiple_choice' || activeQ.type === 'multiple_selection') && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Choices & Logic</label>
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Select correct answer(s)</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {activeQ.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex gap-3 items-stretch animate-in slide-in-from-left-2 duration-200">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...activeQ.options]
                                                                const oldVal = newOpts[optIdx]
                                                                newOpts[optIdx] = e.target.value
                                                                const newCorrect = activeQ.correctAnswers.map(a => a === oldVal ? e.target.value : a)
                                                                updateQuestion(activeQuestionIndex, { options: newOpts, correctAnswers: newCorrect })
                                                            }}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                                                            placeholder={`Option ${optIdx + 1}`}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCorrectAnswer(activeQuestionIndex, opt)}
                                                        className={`px-6 rounded-2xl border transition-all flex items-center justify-center ${activeQ.correctAnswers.includes(opt) && opt !== '' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' : 'bg-zinc-950 border-zinc-800 text-zinc-800 hover:text-emerald-500 hover:border-emerald-500/50'}`}
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    {activeQ.options.length > 2 && (
                                                        <button
                                                            onClick={() => {
                                                                const newOpts = activeQ.options.filter((_, i) => i !== optIdx)
                                                                updateQuestion(activeQuestionIndex, { options: newOpts })
                                                            }}
                                                            className="p-3 text-zinc-800 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => updateQuestion(activeQuestionIndex, { options: [...activeQ.options, ''] })}
                                                className="w-full border-2 border-dashed border-zinc-800 text-zinc-500 hover:border-blue-500/50 hover:text-blue-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-zinc-950/40"
                                            >
                                                + Add Choice
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeQ.type === 'fill_blanks' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Required Exact Phrase</label>
                                            <input
                                                value={activeQ.correctAnswers[0] || ''}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, { correctAnswers: [e.target.value] })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                                                placeholder="e.g. Cleared for takeoff"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateQuestion(activeQuestionIndex, { needsManualGrading: !activeQ.needsManualGrading })}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${activeQ.needsManualGrading ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${activeQ.needsManualGrading ? 'bg-amber-500 border-amber-500' : 'border-zinc-800'}`}>
                                                {activeQ.needsManualGrading && <CheckCircle2 className="w-4 h-4 text-zinc-950" />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-black uppercase tracking-widest">Enable Manual Review</p>
                                                <p className="text-[9px] font-bold opacity-60">HQ must grade this for exact accuracy</p>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {activeQ.type === 'written' && (
                                    <div className="p-10 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-4">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                                            <Edit3 className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">System will allow free-text entry. Training Officers must manually grade these responses later.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-center">
                                    <HelpCircle className="w-10 h-10 text-zinc-800" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white tracking-tighter uppercase">No Questions Yet</h4>
                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Start by adding a curriculum item</p>
                                </div>
                                <button
                                    onClick={addQuestion}
                                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    + Create First Question
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-6 md:p-10 border-t border-zinc-800/50 bg-zinc-950 md:bg-zinc-900/50 flex flex-col md:flex-row gap-4 md:justify-between items-center flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-4 text-zinc-500 font-bold hover:text-white transition-colors text-xs uppercase tracking-widest"
                    >
                        Discard Changes
                    </button>
                    <button
                        disabled={questions.length === 0 || loading}
                        onClick={handleSave}
                        className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                        Publish Structure
                    </button>
                </footer>
            </div>
        </div>
    )
}

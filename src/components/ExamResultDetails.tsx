'use client'

import { X, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Question {
    id: string
    question_text: string
    question_type: string
    options: string[]
    correct_answer?: string
}

interface Response {
    id: string
    answer_text: string
    is_correct: boolean | null
    question: Question
}

interface ExamResultDetailsProps {
    isOpen: boolean
    onClose: () => void
    progress: {
        score_percentage: number
        completed_at: string
        module: {
            title: string
            course: {
                title: string
            }
        }
    }
    responses: Response[]
}

export default function ExamResultDetails({ isOpen, onClose, progress, responses }: ExamResultDetailsProps) {
    if (!isOpen) return null

    const score = progress.score_percentage || 0
    const passed = score >= 70

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Exam Results</h2>
                        <p className="text-sm text-zinc-500 font-medium mt-1">{progress.module.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Score Summary */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-2">Final Score</p>
                                <div className="flex items-center gap-4">
                                    <span className={`text-5xl font-black ${score >= 90 ? 'text-green-500' :
                                            score >= 70 ? 'text-blue-500' :
                                                score >= 50 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                        {score}%
                                    </span>
                                    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${passed ? 'bg-green-500/20 border-green-500/30 text-green-500' : 'bg-red-500/20 border-red-500/30 text-red-500'
                                        }`}>
                                        {passed ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span className="text-sm font-black uppercase">Passed</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-5 h-5" />
                                                <span className="text-sm font-black uppercase">Failed</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-2">Completed</p>
                                <p className="text-white font-bold">
                                    {new Date(progress.completed_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="text-zinc-600 text-sm">
                                    {new Date(progress.completed_at).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Questions and Answers */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Questions & Answers</h3>
                        {responses.map((response, index) => {
                            const isCorrect = response.is_correct
                            const needsReview = isCorrect === null

                            return (
                                <div
                                    key={response.id}
                                    className={`bg-zinc-950 border rounded-2xl p-6 ${isCorrect ? 'border-green-500/30' :
                                            needsReview ? 'border-yellow-500/30' :
                                                'border-red-500/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500 flex-shrink-0 text-sm">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-base font-bold text-white leading-tight">
                                                {response.question.question_text}
                                            </h4>

                                            {/* Your Answer */}
                                            <div>
                                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-2">Your Answer</p>
                                                <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-500/10 border-green-500/30' :
                                                        needsReview ? 'bg-yellow-500/10 border-yellow-500/30' :
                                                            'bg-red-500/10 border-red-500/30'
                                                    }`}>
                                                    <p className="text-white font-medium">{response.answer_text}</p>
                                                </div>
                                            </div>

                                            {/* Correct Answer (if wrong) */}
                                            {!isCorrect && !needsReview && response.question.correct_answer && (
                                                <div>
                                                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-2">Correct Answer</p>
                                                    <div className="p-4 rounded-xl border bg-green-500/10 border-green-500/30">
                                                        <p className="text-white font-medium">{response.question.correct_answer}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2">
                                                {isCorrect ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm font-bold text-green-500">Correct</span>
                                                    </>
                                                ) : needsReview ? (
                                                    <>
                                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-sm font-bold text-yellow-500">Pending Manual Review</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-sm font-bold text-red-500">Incorrect</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

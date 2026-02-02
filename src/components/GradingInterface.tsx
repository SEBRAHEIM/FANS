'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Response {
    id: string
    user_id: string
    question_id: string
    answer_text: string
    is_correct: boolean | null
    feedback: string | null
    profiles: {
        full_name: string
    }
    quiz_questions: {
        question_text: string
        question_type: string
        correct_answer?: string
        module?: {
            title: string
            course: { title: string }
        }
    }
}

interface GradingInterfaceProps {
    initialResponses: Response[]
}

export default function GradingInterface({ initialResponses }: GradingInterfaceProps) {
    const router = useRouter()
    const [responses, setResponses] = useState(initialResponses)
    const [grading, setGrading] = useState<Record<string, { is_correct: boolean, feedback: string }>>({})
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    async function handleGrade(id: string) {
        setLoading(true)
        const grade = grading[id]
        if (!grade) return

        const { error } = await supabase
            .from('student_responses')
            .update({
                is_correct: grade.is_correct,
                feedback: grade.feedback,
                graded_by: (await supabase.auth.getUser()).data.user?.id
            })
            .eq('id', id)

        if (error) {
            alert('Error updating grade: ' + error.message)
        } else {
            setResponses(responses.filter(r => r.id !== id))
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <header className="mb-6 md:mb-10">
                <h2 className="text-xl md:text-2xl lg:text-4xl font-black tracking-tighter uppercase text-white">MANUAL GRADING</h2>
                <p className="text-zinc-500 text-xs md:text-base font-medium tracking-tight">Evaluate written responses and provide feedback to ATCOs.</p>
            </header>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
                {responses.map((res) => (
                    <div key={res.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-zinc-400 text-sm md:text-base">
                                    {(res.profiles?.full_name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm md:text-lg font-bold text-white truncate">{res.profiles?.full_name || 'Unknown User'}</h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">
                                        {res.quiz_questions?.module?.course?.title || 'FANS'} • {res.quiz_questions?.module?.title || 'Training'}
                                    </p>
                                </div>
                            </div>
                            <span className="bg-amber-500/10 text-amber-500 text-[8px] md:text-[10px] font-black px-2 md:px-4 py-1.5 md:py-2 rounded-full uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                Review
                            </span>
                        </div>

                        <div className="space-y-4 pt-4 md:pt-6 border-t border-zinc-800/50">
                            <div className="space-y-1.5 md:space-y-2">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600">Question Prompt</p>
                                <p className="text-xs md:text-sm font-bold text-white leading-relaxed line-clamp-3 md:line-clamp-none">
                                    {res.quiz_questions?.question_text || 'Loading question...'}
                                </p>
                            </div>
                            <div className="bg-zinc-950 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-800/50">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 md:mb-3 ml-1">ATCO Response</p>
                                <p className="text-zinc-300 text-xs md:text-sm font-medium italic leading-relaxed">"{res.answer_text}"</p>
                            </div>

                            {res.quiz_questions?.correct_answer && (
                                <div className="bg-emerald-500/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-emerald-500/10">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500/50 mb-2 md:mb-3 ml-1">Reference Answer</p>
                                    <p className="text-emerald-500/80 font-bold text-xs md:text-sm leading-relaxed">{res.quiz_questions.correct_answer}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4 md:pt-6 border-t border-zinc-800/50">
                            <div className="space-y-2.5 md:space-y-3">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Evaluation</p>
                                <div className="flex gap-2 md:gap-3">
                                    <button
                                        onClick={() => setGrading({ ...grading, [res.id]: { ...grading[res.id], is_correct: true } })}
                                        className={`flex-1 p-3 md:p-4 rounded-lg md:rounded-xl border transition-all flex items-center justify-center gap-2 md:gap-3 ${grading[res.id]?.is_correct === true ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-700 hover:text-emerald-500'}`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Pass</span>
                                    </button>
                                    <button
                                        onClick={() => setGrading({ ...grading, [res.id]: { ...grading[res.id], is_correct: false } })}
                                        className={`flex-1 p-3 md:p-4 rounded-lg md:rounded-xl border transition-all flex items-center justify-center gap-2 md:gap-3 ${grading[res.id]?.is_correct === false ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-700 hover:text-red-500'}`}
                                    >
                                        <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Fail</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2.5 md:space-y-3">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Feedback & Submit</p>
                                <div className="flex gap-2 md:gap-3">
                                    <input
                                        value={grading[res.id]?.feedback || ''}
                                        onChange={(e) => setGrading({ ...grading, [res.id]: { ...grading[res.id], feedback: e.target.value } })}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-xl p-3 md:p-4 text-[11px] md:text-xs font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                                        placeholder="Add feedback..."
                                    />
                                    <button
                                        disabled={loading || grading[res.id]?.is_correct === undefined}
                                        onClick={() => handleGrade(res.id)}
                                        className="bg-zinc-100 text-zinc-950 px-5 md:px-6 rounded-lg md:rounded-xl transition-all active:scale-95 disabled:opacity-50 hover:bg-white"
                                    >
                                        <Save className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {responses.length === 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 p-12 md:p-20 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-emerald-500/20 mb-4 md:mb-6" />
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Queue Clear</h3>
                        <p className="text-xs md:text-sm text-zinc-500 max-w-xs md:max-w-md">All written responses have been evaluated. Great job, Officer.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

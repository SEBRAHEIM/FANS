'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { finalizeModuleGrading } from '@/app/officer/grading-actions'

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
            id: string
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
            // Check if this was the last response to grade for this module
            const resData = responses.find(r => r.id === id)
            if (resData && resData.quiz_questions?.module) {
                await finalizeModuleGrading(resData.user_id, (resData.quiz_questions as any).module_id || resData.quiz_questions.module.id)
            }

            setResponses(responses.filter(r => r.id !== id))
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6 md:space-y-10 animate-fade-in px-4 sm:px-0">
            <header className="mb-6 md:mb-12">
                <h1 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white drop-shadow-sm">MANUAL GRADING</h1>
                <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2 ml-1">Evaluate and refine training performance records.</p>
            </header>

            <div className="grid grid-cols-1 gap-6 md:gap-10">
                {responses.map((res) => (
                    <div key={res.id} className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 lg:p-12 space-y-8 md:space-y-12 animate-slide-up card-hover">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center font-black text-zinc-400 text-lg md:text-xl shadow-inner">
                                    {(res.profiles?.full_name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base md:text-xl font-black text-white truncate uppercase tracking-tight">{res.profiles?.full_name || 'Unknown User'}</h3>
                                    <p className="text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                        {res.quiz_questions?.module?.course?.title || 'FANS CENTRAL'} • {res.quiz_questions?.module?.title || 'UNIT ASSESSMENT'}
                                    </p>
                                </div>
                            </div>
                            <span className="glass-accent text-amber-500 text-[10px] md:text-[11px] font-black px-4 md:px-6 py-2 md:py-3 rounded-full uppercase tracking-widest flex items-center gap-2 flex-shrink-0 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                Awaiting Command
                            </span>
                        </div>

                        <div className="space-y-6 md:space-y-8 pt-8 md:pt-10 border-t border-white/5">
                            <div className="space-y-3">
                                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Question Context</p>
                                <p className="text-sm md:text-lg font-bold text-white leading-relaxed max-w-4xl">
                                    {res.quiz_questions?.question_text || 'Loading question...'}
                                </p>
                            </div>
                            <div className="bg-zinc-950 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-inner">
                                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 ml-1">ATCO Response</p>
                                <p className="text-zinc-300 text-sm md:text-base font-medium italic leading-relaxed">"{res.answer_text}"</p>
                            </div>

                            {res.quiz_questions?.correct_answer && (
                                <div className="bg-emerald-500/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-emerald-500/10 shadow-sm">
                                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500/50 mb-4 ml-1">Command-Expected Reference</p>
                                    <p className="text-emerald-500 font-black text-sm md:text-base leading-relaxed">{res.quiz_questions.correct_answer}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 pt-8 md:pt-10 border-t border-white/5">
                            <div className="space-y-4">
                                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Validation</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setGrading({ ...grading, [res.id]: { ...grading[res.id], is_correct: true } })}
                                        className={`flex-1 p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 active:scale-95 ${grading[res.id]?.is_correct === true ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]' : 'bg-zinc-950 border-white/5 text-zinc-700 hover:border-emerald-500/30 hover:text-emerald-500'}`}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Pass Status</span>
                                    </button>
                                    <button
                                        onClick={() => setGrading({ ...grading, [res.id]: { ...grading[res.id], is_correct: false } })}
                                        className={`flex-1 p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 active:scale-95 ${grading[res.id]?.is_correct === false ? 'bg-red-600 border-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)]' : 'bg-zinc-950 border-white/5 text-zinc-700 hover:border-red-500/30 hover:text-red-500'}`}
                                    >
                                        <XCircle className="w-5 h-5" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Fail Status</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Feedback Command</p>
                                <div className="flex gap-4">
                                    <input
                                        value={grading[res.id]?.feedback || ''}
                                        onChange={(e) => setGrading({ ...grading, [res.id]: { ...grading[res.id], feedback: e.target.value } })}
                                        className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl p-4 md:p-5 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800 shadow-inner"
                                        placeholder="Add professional feedback..."
                                    />
                                    <button
                                        disabled={loading || grading[res.id]?.is_correct === undefined}
                                        onClick={() => handleGrade(res.id)}
                                        className="bg-white text-zinc-950 px-8 md:px-10 rounded-2xl transition-all active:scale-95 disabled:opacity-20 hover:bg-blue-500 hover:text-white shadow-xl shadow-white/5 disabled:pointer-events-none"
                                    >
                                        <Save className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {responses.length === 0 && (
                    <div className="glass p-20 md:p-32 rounded-[3rem] md:rounded-[4rem] flex flex-col items-center justify-center text-center animate-fade-in shadow-2xl">
                        <div className="w-24 h-24 rounded-3xl glass-accent flex items-center justify-center mb-8">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-4 uppercase tracking-tighter">Queue Clear</h3>
                        <p className="text-sm md:text-base text-zinc-500 max-w-md font-medium leading-relaxed">All active written assessments have been finalized. Excellent command, Officer.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

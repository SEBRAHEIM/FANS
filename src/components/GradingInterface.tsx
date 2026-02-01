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
        username: string
    }
    quiz_questions: {
        question_text: string
        question_type: string
        correct_answer?: string
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
        <div className="space-y-8">
            <header className="mb-10">
                <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">MANUAL GRADING</h2>
                <p className="text-zinc-500 font-medium tracking-tight">Evaluate written responses and provide feedback to ATCOs.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {responses.map((res) => (
                    <div key={res.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-zinc-400">
                                    {res.profiles.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{res.profiles.full_name}</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">@{res.profiles.username}</p>
                                </div>
                            </div>
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-amber-500/20 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Pending Review
                            </span>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Question Prompt</p>
                                <p className="text-sm font-bold text-white leading-relaxed">{res.quiz_questions.question_text}</p>
                            </div>
                            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 ml-1">ATCO Response</p>
                                <p className="text-zinc-300 font-medium italic leading-relaxed">"{res.answer_text}"</p>
                            </div>

                            {res.quiz_questions.correct_answer && (
                                <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50 mb-3 ml-1">Reference Answer (System Suggestion)</p>
                                    <p className="text-emerald-500/80 font-bold text-sm leading-relaxed">{res.quiz_questions.correct_answer}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-zinc-800/50">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Manual Evaluation</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setGrading({ ...grading, [res.id]: { ...grading[res.id], is_correct: true } })}
                                        className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${grading[res.id]?.is_correct === true ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-700 hover:text-emerald-500'}`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pass</span>
                                    </button>
                                    <button
                                        onClick={() => setGrading({ ...grading, [res.id]: { ...grading[res.id], is_correct: false } })}
                                        className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${grading[res.id]?.is_correct === false ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-700 hover:text-red-500'}`}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Fail</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Instructor Feedback</p>
                                <div className="flex gap-3">
                                    <input
                                        value={grading[res.id]?.feedback || ''}
                                        onChange={(e) => setGrading({ ...grading, [res.id]: { ...grading[res.id], feedback: e.target.value } })}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                                        placeholder="Add encouragement or corrections..."
                                    />
                                    <button
                                        disabled={loading || grading[res.id]?.is_correct === undefined}
                                        onClick={() => handleGrade(res.id)}
                                        className="bg-zinc-100 text-zinc-950 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 hover:bg-white"
                                    >
                                        <Save className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {responses.length === 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-20 h-20 text-emerald-500/20 mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Queue Clear</h3>
                        <p className="text-zinc-500 max-w-md">All written responses have been evaluated. Great job, Officer.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

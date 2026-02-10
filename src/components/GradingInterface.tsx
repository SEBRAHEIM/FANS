'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Submission {
    id: string
    atco_id: string
    assessment_id: string
    atco: { full_name: string }
    assessment: { title: string }
    responses: any[]
}

interface GradingInterfaceProps {
    initialSubmissions: Submission[]
}

export default function GradingInterface({ initialSubmissions }: GradingInterfaceProps) {
    const router = useRouter()
    const [submissions, setSubmissions] = useState(initialSubmissions)
    const [gradingState, setGradingState] = useState<Record<string, Record<string, { is_correct: boolean, feedback: string }>>>({})
    const [loading, setLoading] = useState<string | null>(null)
    const supabase = createClient()

    const updateResponseState = (subId: string, resId: string, data: any) => {
        setGradingState(prev => ({
            ...prev,
            [subId]: {
                ...prev[subId],
                [resId]: {
                    ...prev[subId]?.[resId],
                    ...data
                }
            }
        }))
    }

    const handleFinalizeSubmission = async (subId: string) => {
        const sub = submissions.find(s => s.id === subId)
        if (!sub) return

        const responses = sub.responses
        const currentGrading = gradingState[subId] || {}

        // Validate all responses are graded
        const allGraded = responses.every(r => currentGrading[r.id]?.is_correct !== undefined)
        if (!allGraded) {
            alert('ALL RESPONSES IN THIS SUBMISSION MUST BE EVALUATED BEFORE FINALIZATION.')
            return
        }

        setLoading(subId)
        try {
            // 1. Update all responses
            for (const res of responses) {
                const grade = currentGrading[res.id]
                await supabase
                    .from('student_responses')
                    .update({
                        is_correct: grade.is_correct,
                        feedback: grade.feedback,
                        graded_at: new Date().toISOString()
                    })
                    .eq('id', res.id)
            }

            // 2. Calculate score
            const correctCount = responses.filter(r => currentGrading[r.id].is_correct).length
            const totalCount = responses.length
            const score = Math.round((correctCount / totalCount) * 100)

            // 3. Mark submission as graded
            const { error: subError } = await supabase
                .from('submissions')
                .update({
                    graded: true,
                    score: score,
                    graded_at: new Date().toISOString()
                })
                .eq('id', subId)

            if (subError) throw subError

            // 4. Create result record
            await supabase.from('results').insert({
                atco_id: sub.atco_id,
                course_id: null, // Could be linked if needed
                assessment_id: sub.assessment_id,
                score: score,
                pass: score >= 70, // Basic threshold
                metadata: { submission_id: subId }
            })

            setSubmissions(submissions.filter(s => s.id !== subId))
            router.refresh()
        } catch (err: any) {
            alert('Finalization Error: ' + err.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-12">
            {submissions.map((sub) => (
                <div key={sub.id} className="glass rounded-[3rem] overflow-hidden border border-white/5 hover:border-blue-500/20 transition-all">
                    <header className="p-8 md:p-10 bg-zinc-900/40 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-2xl shadow-blue-500/20">
                                {sub.atco?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">{sub.atco?.full_name}</h3>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">{sub.assessment?.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Attempt Status</p>
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Awaiting Verification</p>
                            </div>
                            <button
                                onClick={() => handleFinalizeSubmission(sub.id)}
                                disabled={loading === sub.id}
                                className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {loading === sub.id ? 'PROCESSING...' : 'Finalize Grades'}
                            </button>
                        </div>
                    </header>

                    <div className="p-8 md:p-10 space-y-12">
                        {sub.responses.map((res, i) => (
                            <div key={res.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-zinc-700">{(i + 1).toString().padStart(2, '0')}</span>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{res.question?.question_text}</h4>
                                    </div>
                                    <div className="bg-zinc-950 p-8 rounded-[2rem] border border-white/5">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-4">ATCO Response Output</p>
                                        <p className="text-zinc-300 font-medium italic leading-relaxed">"{res.answer_text}"</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
                                    <div className="space-y-4">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Manual Validation</p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => updateResponseState(sub.id, res.id, { is_correct: true })}
                                                className={`flex-1 p-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${gradingState[sub.id]?.[res.id]?.is_correct === true ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-950 border-white/5 text-zinc-700 hover:text-emerald-500'}`}
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Verify Correct</span>
                                            </button>
                                            <button
                                                onClick={() => updateResponseState(sub.id, res.id, { is_correct: false })}
                                                className={`flex-1 p-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${gradingState[sub.id]?.[res.id]?.is_correct === false ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-950 border-white/5 text-zinc-700 hover:text-red-500'}`}
                                            >
                                                <XCircle className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Mark Flagged</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Feedback Memo</p>
                                        <input
                                            type="text"
                                            placeholder="ENTER OPERATIONAL FEEDBACK..."
                                            value={gradingState[sub.id]?.[res.id]?.feedback || ''}
                                            onChange={(e) => updateResponseState(sub.id, res.id, { feedback: e.target.value })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-5 text-[11px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-800"
                                        />
                                    </div>
                                </div>
                                {i < sub.responses.length - 1 && <div className="border-t border-white/5 pt-8" />}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {submissions.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center glass rounded-[4rem]">
                    <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Pipeline Clear</h3>
                    <p className="text-zinc-500 max-w-md font-bold text-[11px] uppercase tracking-widest leading-loose">No pending assessments require manual command intervention.</p>
                </div>
            )}
        </div>
    )
}

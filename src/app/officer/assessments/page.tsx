import { createClient } from '@/lib/supabase/server'
import { HelpCircle, ChevronRight, Users, CheckCircle2, AlertCircle, Search, Target, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function AssessmentsPage() {
    const supabase = await createClient()

    // 1. Fetch total assessments
    const { data: assessments } = await supabase
        .from('assessments')
        .select(`
            *,
            course:courses(title),
            questions(count)
        `)
        .order('created_at', { ascending: false })

    // 2. Fetch manual grading queue count from new table
    const { count: gradingCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('needs_manual', true)
        .eq('graded', false)

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-12">
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">
                        Assessments
                    </h2>
                    <p className="text-zinc-500 font-bold text-[11px] lg:text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                        <Target className="w-4 h-4 text-blue-500" />
                        Knowledge Validation & Qualification Command
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link
                        href="/officer/grading"
                        className="flex-1 md:flex-none flex items-center justify-between gap-6 px-8 py-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-500/20 transition-all shadow-xl shadow-emerald-500/5"
                    >
                        <div className="space-y-1">
                            <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Grading Queue</span>
                            <span className="block text-2xl font-black text-white leading-none">{gradingCount || 0}</span>
                        </div>
                        <AlertCircle className="w-6 h-6 text-emerald-500 group-hover:rotate-12 transition-transform" />
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                {[
                    { label: 'Evaluation Points', value: '450', icon: HelpCircle, color: 'text-blue-500' },
                    { label: 'Standard Exams', value: assessments?.length || 0, icon: FileText, color: 'text-zinc-400' },
                    { label: 'Pass Ratio', value: '82%', icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Avg Attempts', value: '1.4', icon: Users, color: 'text-zinc-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] space-y-4">
                        <div className="flex justify-between items-start">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <span className="block text-3xl font-black text-white tracking-tighter">{stat.value}</span>
                            <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4">
                        {['ALL', 'DRAFT', 'PUBLISHED'].map(f => (
                            <button key={f} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="SEARCH ASSESSMENTS..."
                            className="w-full bg-zinc-950 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[9px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Name</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Linked Course</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Config</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments && assessments.length > 0 ? (
                                assessments.map((assessment: any) => (
                                    <tr key={assessment.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-500 transition-colors">{assessment.title}</p>
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{assessment.grading} GRADING</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{assessment.course?.title || 'Standalone'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                                <span>{assessment.questions[0]?.count || 0} Qs</span>
                                                <span>{assessment.pass_mark}% Pass</span>
                                                <span>{assessment.attempts_allowed} Att</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${assessment.status === 'PUBLISHED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                }`}>
                                                {assessment.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/officer/assessments/${assessment.id}`}
                                                className="inline-flex p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <Target className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                        No assessment protocols initialized
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function Settings(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

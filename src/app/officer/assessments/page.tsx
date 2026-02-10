import { createClient } from '@/lib/supabase/server'
import { HelpCircle, ChevronRight, Users, CheckCircle2, AlertCircle, Search, Target, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function AssessmentsPage() {
    const supabase = await createClient()

    // Fetch all courses with their question counts
    const { data: assessments } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            status,
            category,
            modules:course_modules(
                id,
                title,
                questions:quiz_questions(count)
            )
        `)
        .order('created_at', { ascending: false })

    // Fetch manual grading queue count
    const { count: gradingCount } = await supabase
        .from('student_responses')
        .select('*', { count: 'exact', head: true })
        .is('is_correct', null)

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-12">
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">
                        ASSESSMENT CONTROL
                    </h2>
                    <p className="text-zinc-500 font-bold text-[11px] lg:text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                        <Target className="w-4 h-4 text-blue-500" />
                        Knowledge Validation & Grading Command
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link
                        href="/officer/grading"
                        className="flex-1 md:flex-none flex items-center justify-between gap-6 px-8 py-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl group hover:bg-amber-500/20 transition-all shadow-xl shadow-amber-500/5"
                    >
                        <div className="space-y-1">
                            <span className="block text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Manual Queue</span>
                            <span className="block text-2xl font-black text-white leading-none">{gradingCount || 0}</span>
                        </div>
                        <AlertCircle className="w-6 h-6 text-amber-500 group-hover:rotate-12 transition-transform" />
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                {[
                    { label: 'Evaluation Points', value: assessments?.reduce((acc, c) => acc + c.modules.reduce((mAcc: number, m: any) => mAcc + (m.questions[0]?.count || 0), 0), 0), icon: HelpCircle, color: 'text-blue-500' },
                    { label: 'Active Curriculums', value: assessments?.length || 0, icon: FileText, color: 'text-zinc-400' },
                    { label: 'System Accuracy', value: '98.4%', icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Avg Pass Rate', value: '72%', icon: Users, color: 'text-zinc-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] space-y-4 backdrop-blur-sm grayscale hover:grayscale-0 transition-all">
                        <div className="flex justify-between items-start">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Live Signal</span>
                        </div>
                        <div>
                            <span className="block text-3xl font-black text-white tracking-tighter">{stat.value}</span>
                            <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Evaluation Registry</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="FILTER REGISTRY..."
                            className="bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all w-64"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {assessments?.map((course) => (
                        <div key={course.id} className="group bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/80 transition-all active:scale-[0.995]">
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-blue-500 transition-all">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none group-hover:text-blue-500 transition-colors">{course.title}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${course.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                            }`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        <span>{course.category}</span>
                                        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                        <span>{course.modules.length} Modules</span>
                                        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                        <span className="text-zinc-400">{course.modules.reduce((acc: number, m: any) => acc + (m.questions[0]?.count || 0), 0)} Total Questions</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/officer/content?edit=${course.id}`}
                                className="p-4 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <Settings className="w-5 h-5" />
                            </Link>
                        </div>
                    ))}
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

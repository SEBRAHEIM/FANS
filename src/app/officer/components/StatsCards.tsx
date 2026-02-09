import { createClient } from '@/lib/supabase/server'
import { Calendar, CheckSquare, BookOpen, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function StatsCards() {
    const supabase = await createClient()

    // Fetch stats in parallel
    const [
        { count: totalSessions },
        { count: pendingGrades },
        { count: courseCount }
    ] = await Promise.all([
        supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true }),
        supabase
            .from('student_responses')
            .select('*', { count: 'exact', head: true })
            .is('is_correct', null),
        supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
    ])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10 text-zinc-100 animate-slide-up">
            <Link href="/officer/planning" className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98] card-hover">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg shadow-blue-500/5">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20">
                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                        LIVE STATUS
                    </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 ml-1">Active Sessions</p>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white drop-shadow-sm">{totalSessions || 0}</span>
            </Link>

            <Link href="/officer/grading" className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:border-emerald-500/30 transition-all active:scale-[0.98] card-hover">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/5">
                        <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {pendingGrades && pendingGrades > 0 ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            {pendingGrades} PENDING
                        </span>
                    ) : null}
                </div>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 ml-1">Manual Grading</p>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-emerald-500 drop-shadow-sm">{pendingGrades || 0}</span>
            </Link>

            <Link href="/officer/content" className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:border-purple-500/30 transition-all active:scale-[0.98] card-hover">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg shadow-purple-500/5">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                </div>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 ml-1">Video Courses</p>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white drop-shadow-sm">{courseCount || 0}</span>
            </Link>

            <Link href="/officer/results" className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:border-blue-500/30 transition-all active:scale-[0.98] card-hover">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg shadow-blue-500/5">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20">
                        PDF EXPORT
                    </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 ml-1">Exam Results</p>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white drop-shadow-sm">VIEW</span>
            </Link>
        </div>
    )
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-zinc-900 border border-zinc-800/50 rounded-[2rem] sm:rounded-[2.5rem]" />
            ))}
        </div>
    )
}

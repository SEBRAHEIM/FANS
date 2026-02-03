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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10 text-zinc-100">
            <Link href="/officer/planning" className="bg-zinc-900 border border-zinc-800/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-[9px] sm:text-[10px] font-bold text-blue-500 uppercase tracking-widest border border-blue-500/20">
                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                        LIVE
                    </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Active Sessions</p>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter">{totalSessions || 0}</span>
            </Link>


            <Link href="/officer/grading" className="bg-zinc-900 border border-zinc-800/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:border-emerald-500/30 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {pendingGrades && pendingGrades > 0 ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            {pendingGrades} PENDING
                        </span>
                    ) : null}
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Manual Grading</p>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-emerald-500">{pendingGrades || 0}</span>
            </Link>

            <Link href="/officer/content" className="bg-zinc-900 border border-zinc-800/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:border-purple-500/30 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Video Courses</p>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-zinc-600">{courseCount || 0}</span>
            </Link>

            <Link href="/officer/results" className="bg-zinc-900 border border-zinc-800/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:border-blue-500/30 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-[9px] sm:text-[10px] font-bold text-blue-500 uppercase tracking-widest border border-blue-500/20">
                        PDF EXPORT
                    </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Exam Results</p>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-zinc-100">VIEW</span>
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

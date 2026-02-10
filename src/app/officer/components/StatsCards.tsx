import { createClient } from '@/lib/supabase/server'
import { Calendar, CheckSquare, BookOpen, FileText, Users } from 'lucide-react'
import Link from 'next/link'

export default async function StatsCards() {
    const supabase = await createClient()

    // Fetch stats in parallel
    const [
        { count: activeCourses },
        { count: atcosActive },
        { count: pendingGrades },
        { count: upcomingSessions }
    ] = await Promise.all([
        supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published'),
        supabase
            .from('course_assignments')
            .select('user_id', { count: 'exact', head: true }), // Unique users with assignments
        supabase
            .from('student_responses')
            .select('*', { count: 'exact', head: true })
            .is('is_correct', null),
        supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .gte('start_date', new Date().toISOString())
    ])

    const stats = [
        { label: 'Live Certifications', value: activeCourses || 0, href: '/officer/content', icon: BookOpen, color: 'text-blue-500' },
        { label: 'Controllers In Cycle', value: atcosActive || 0, href: '/officer/assignments?filter=active', icon: Users, color: 'text-zinc-100' },
        { label: 'Grading Queue', value: pendingGrades || 0, href: '/officer/grading', icon: CheckSquare, color: 'text-emerald-500', alert: pendingGrades && pendingGrades > 0 },
        { label: 'Active Deployments', value: upcomingSessions || 0, href: '/officer/planning', icon: Calendar, color: 'text-white' },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10 text-zinc-100 animate-slide-up">
            {stats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98] card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-all shadow-lg flex items-center justify-center ${stat.color} bg-white/5 group-hover:bg-blue-500 group-hover:text-white`}>
                            <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        {stat.alert && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                ACTION REQUIRED
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 ml-1">{stat.label}</p>
                    <span className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-sm ${stat.color}`}>{stat.value}</span>
                </Link>
            ))}
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

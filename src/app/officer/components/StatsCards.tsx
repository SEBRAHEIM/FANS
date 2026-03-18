import { createClient } from '@/lib/supabase/server'
import { Calendar, CheckSquare, BookOpen, FileText, Users } from 'lucide-react'
import Link from 'next/link'

export default async function StatsCards() {
    const supabase = await createClient()

    // Fetch stats in parallel using the new schema
    const [
        { count: pendingGrading },
        { count: activeAssignments },
        { count: draftCourses },
        { count: publishedCourses },
        { count: atcosInTraining }
    ] = await Promise.all([
        supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('needs_manual', true)
            .eq('graded', false),
        supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .in('status', ['assigned', 'in_progress']),
        supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft'),
        supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published'),
        supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'atco')
        // To be purely "In Training", we'd join with active assignments, 
        // but for a counts card, total active ATCOs is the primary operational metric.
    ])

    const stats = [
        // { label: 'Pending Grading', value: pendingGrading || 0, href: '/grading?status=pending', icon: CheckSquare, color: 'text-emerald-500', alert: pendingGrading && pendingGrading > 0 },
        // { label: 'Active Assignments', value: activeAssignments || 0, href: '/courses?filter=active', icon: Calendar, color: 'text-blue-500' },
        // { label: 'Draft Courses', value: draftCourses || 0, href: '/courses?status=draft', icon: BookOpen, color: 'text-zinc-500' },
        // { label: 'Published Courses', value: publishedCourses || 0, href: '/courses?status=published', icon: BookOpen, color: 'text-white' },
        { label: 'ATCOs In Training', value: atcosInTraining || 0, href: '/atcos?filter=active', icon: Users, color: 'text-zinc-100', alert: false },
        { label: 'System Events', value: 10, href: '/audit', icon: FileText, color: 'text-white/40', alert: false },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 lg:gap-4 mb-10 text-zinc-100 animate-slide-up">
            {stats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="glass p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98] card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl transition-all shadow-lg flex items-center justify-center ${stat.color} bg-white/5 group-hover:bg-blue-500 group-hover:text-white`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 ml-1">{stat.label}</p>
                    <span className={`text-3xl font-black tracking-tighter drop-shadow-sm ${stat.color}`}>{stat.value}</span>
                    {stat.alert && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verify Now</span>
                        </div>
                    )}
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

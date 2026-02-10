import { createClient } from '@/lib/supabase/server'
import { Clock, ArrowRight, BookOpen, Calendar, Target } from 'lucide-react'
import Link from 'next/link'

export default async function UpcomingSessions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch Course Assignments
    const { data: assignments } = await supabase
        .from('assignments')
        .select(`
            *,
            course:courses(title, description)
        `)
        .eq('atco_id', user?.id)
        .in('status', ['in_progress', 'pending'])
        .order('created_at', { ascending: false })

    // 2. Fetch Scheduled Sessions (Calendar events)
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            *,
            course:courses(title),
            location:locations(name)
        `)
        .eq('atco_id', user?.id)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

    return (
        <div className="space-y-12">
            {/* Active Assignments - Course Objects */}
            <div className="glass rounded-[2.5rem] p-10 space-y-8">
                <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-white">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Assigned training
                </h3>

                <div className="grid grid-cols-1 gap-6">
                    {assignments && assignments.length > 0 ? (
                        assignments.map((assignment: any) => (
                            <div key={assignment.id} className="p-8 bg-white/5 rounded-[2rem] border border-white/5 group hover:border-blue-500/30 transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${assignment.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'
                                                }`}>
                                                {assignment.status}
                                            </span>
                                            {assignment.mandatory && (
                                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Mandatory</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-blue-500 transition-colors leading-none mb-2">{assignment.course?.title}</h4>
                                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{assignment.course?.description?.slice(0, 80)}...</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Due Date</p>
                                            <p className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">{assignment.due_date || 'No Limit'}</p>
                                        </div>
                                        <Link
                                            href={`/atco/trainings/${assignment.course_id}`}
                                            className="flex-1 md:flex-none px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-center"
                                        >
                                            Resume path
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-zinc-950/40 rounded-[2rem] border border-dashed border-white/10">
                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">No active training assignments</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scheduled - Sessions */}
            {sessions && sessions.length > 0 && (
                <div className="glass rounded-[2.5rem] p-10 space-y-8">
                    <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-white">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        Next calendar events
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sessions.map((session: any) => (
                            <div key={session.id} className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2rem] space-y-6">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{session.course?.title || 'Training Session'}</h4>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Target className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <Clock className="w-4 h-4 text-zinc-700" />
                                        {new Date(session.start_date).toLocaleDateString()} @ {new Date(session.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <span className="w-4 flex justify-center text-zinc-700 font-serif">📍</span>
                                        {session.location?.name || 'Simulator Center'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function UpcomingSessionsSkeleton() {
    return (
        <div className="space-y-12 animate-pulse">
            <div className="h-64 bg-zinc-900 rounded-[2.5rem]" />
            <div className="h-48 bg-zinc-900 rounded-[2.5rem]" />
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CalendarButton from '@/components/CalendarButton'

export default async function UpcomingSessions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Enrollments (for self-enrolled sessions)
    const { data: myEnrollments } = await supabase
        .from('enrollments')
        .select(`
            status,
            session:sessions(
                id,
                start_date,
                end_date,
                status,
                course:courses(title),
                course_manual,
                location:locations(name),
                location_manual,
                instructor:profiles(full_name)
            )
        `)
        .eq('user_id', user?.id)

    // Fetch Direct Assignments (where atco_id is set directly on session)
    const { data: directSessions } = await supabase
        .from('sessions')
        .select(`
            id,
            start_date,
            end_date,
            status,
            course:courses(title),
            course_manual,
            location:locations(name),
            location_manual,
            instructor:profiles(full_name)
        `)
        .eq('atco_id', user?.id)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

    interface SessionData {
        id: string;
        start_date: string;
        end_date: string;
        status: string;
        course?: { title: string } | null;
        course_manual?: string | null;
        location?: { name: string } | null;
        location_manual?: string | null;
        instructor?: { full_name: string } | null;
    }

    interface EnrollmentData {
        status: string;
        session: SessionData;
    }

    // Merge sessions from both sources
    const enrollmentSessions = ((myEnrollments as unknown as EnrollmentData[]) || []).map(e => e.session)
    const allUniqueSessions = Array.from(new Map([
        ...enrollmentSessions,
        ...(directSessions as unknown as SessionData[] || [])
    ].map(s => [s.id, s])).values())

    const upcomingSessions = allUniqueSessions
        .filter(s => new Date(s.start_date) > new Date())
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

    return (
        <div className="glass rounded-[2.5rem] p-6 lg:p-10 animate-slide-up">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter text-white">
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]" />
                Upcoming Sessions
            </h3>

            {upcomingSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:gap-6">
                    {upcomingSessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-blue-500/30 transition-all group relative overflow-hidden card-hover"
                        >
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <h4 className="font-black text-white text-lg mb-2 uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{session.course_manual || session.course?.title || 'Training Session'}</h4>
                                    <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-zinc-700" />
                                            {new Date(session.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        {(session.location_manual || session.location?.name) && (
                                            <span className="flex items-center gap-2 uppercase">
                                                <span className="text-lg leading-none">📍</span>
                                                {session.location_manual || session.location?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-4 min-w-[44px]">
                                    <div className="active:scale-95 transition-transform">
                                        <CalendarButton
                                            title={`Training: ${session.course_manual || session.course?.title || 'Session'}`}
                                            description={`Instructor: ${session.instructor?.full_name || 'TBD'}`}
                                            location={session.location_manual || session.location?.name || ''}
                                            startDate={session.start_date}
                                        />
                                    </div>
                                    <Link href={`/atco/sessions/${session.id}`} className="p-3 bg-white/5 rounded-xl text-zinc-600 hover:text-blue-500 hover:bg-blue-500/10 transition-all group-hover:scale-110 active:scale-90">
                                        <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center glass rounded-3xl border border-dashed border-white/10">
                    <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.2em]">No upcoming command sessions.</p>
                </div>
            )}
        </div>
    )
}

export function UpcomingSessionsSkeleton() {
    return (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 h-[500px] animate-pulse" />
    )
}

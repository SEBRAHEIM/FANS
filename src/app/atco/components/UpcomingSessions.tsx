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
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 lg:p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Upcoming Sessions
            </h3>

            {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                        <div
                            key={session.id}
                            className="block bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl hover:border-blue-500/50 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-white mb-1">{session.course_manual || session.course?.title || 'Training Session'}</p>
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(session.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        {(session.location_manual || session.location?.name) && (
                                            <span>📍 {session.location_manual || session.location?.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <CalendarButton
                                        title={`Training: ${session.course_manual || session.course?.title || 'Session'}`}
                                        description={`Instructor: ${session.instructor?.full_name || 'TBD'}`}
                                        location={session.location_manual || session.location?.name || ''}
                                        startDate={session.start_date}
                                    />
                                    <Link href={`/atco/sessions/${session.id}`}>
                                        <ArrowRight className="w-5 h-5 text-zinc-600 hover:text-blue-500 transition-all" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500 text-sm">No upcoming sessions scheduled.</p>
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

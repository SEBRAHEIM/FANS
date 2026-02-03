import { createClient } from '@/lib/supabase/server'
import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CalendarButton from '@/components/CalendarButton'

export default async function UpcomingSessions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
                location:locations(name),
                instructor:profiles(full_name)
            )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false })

    interface SessionData {
        id: string;
        start_date: string;
        end_date: string;
        status: string;
        course: { title: string };
        location: { name: string };
        instructor?: { full_name: string };
    }

    interface EnrollmentData {
        status: string;
        session: SessionData;
    }

    const typedEnrollments = (myEnrollments as unknown as EnrollmentData[]) || []
    const upcomingSessions = typedEnrollments.filter(e =>
        new Date(e.session.start_date) > new Date()
    )

    return (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 lg:p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Upcoming Sessions
            </h3>

            {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                    {upcomingSessions.map((enrollment) => (
                        <div
                            key={enrollment.session.id}
                            className="block bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl hover:border-blue-500/50 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-white mb-1">{enrollment.session.course.title}</p>
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(enrollment.session.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        {enrollment.session.location?.name && (
                                            <span>📍 {enrollment.session.location.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <CalendarButton
                                        title={`Training: ${enrollment.session.course.title}`}
                                        description={`Instructor: ${enrollment.session.instructor?.full_name || 'TBD'}`}
                                        location={enrollment.session.location?.name || ''}
                                        startDate={enrollment.session.start_date}
                                    />
                                    <Link href={`/atco/sessions/${enrollment.session.id}`}>
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

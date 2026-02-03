import { createClient } from '@/lib/supabase/server'
import { Clock, CheckCircle2, Users, BookOpen, ArrowRight, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import CalendarButton from '@/components/CalendarButton'

export default async function AtcoDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch data in parallel for speed
    const [
        { data: profile },
        { data: myEnrollments },
        { data: ojtiAssignments }
    ] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single(),
        supabase
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
            .order('joined_at', { ascending: false }),
        supabase
            .from('sessions')
            .select(`
                id,
                start_date,
                status,
                course:courses(title),
                location:locations(name),
                atco:profiles!sessions_atco_id_fkey(full_name, username)
            `)
            .eq('ojti_id', user?.id)
    ])

    const typedOjtiAssignments = (ojtiAssignments as any[]) || []

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

    const completedCount = typedEnrollments.filter(e => e.status === 'attended').length

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10">
            <header className="mb-10">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-tight">HELLO, {profile?.full_name?.split(' ')[0] || 'ATCO'}</h2>
                    </div>
                    <Link
                        href="/atco/calendar"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                    >
                        <CalendarIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">View Calendar</span>
                    </Link>
                </div>
                <p className="text-zinc-500 font-medium text-sm">Welcome back to your Training Zone.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content - Upcoming Sessions */}
                <section className="lg:col-span-2">
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
                </section>

                {/* Sidebar Content */}
                <section className="space-y-6">
                    {/* Training Pulse - Simplified */}
                    <Link href="/atco/trainings" className="block bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 hover:border-blue-500/30 transition-all group">
                        <h3 className="text-lg font-bold mb-6">Training Pulse</h3>
                        <div className="flex items-end justify-between mb-6">
                            <div>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Completed Units</p>
                                <span className="text-4xl sm:text-5xl font-black text-white">{completedCount}</span>
                            </div>
                            <CheckCircle2 className="w-12 h-12 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
                        </div>
                        <div className="pt-4 border-t border-zinc-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-zinc-500">Yearly Goal</span>
                                <span className="text-xs font-bold text-blue-500">{Math.min((completedCount / 10 * 100), 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                                    style={{ width: `${Math.min((completedCount / 10) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </Link>

                    {/* OJTI Command - Only if user is OJTI */}
                    {profile?.is_ojti && typedOjtiAssignments.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-500" />
                                OJTI Command
                            </h3>
                            <div className="space-y-3">
                                {typedOjtiAssignments.slice(0, 3).map((session: any) => (
                                    <Link
                                        key={session.id}
                                        href={`/atco/sessions/${session.id}`}
                                        className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-sm">
                                                {session.atco?.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{session.atco?.username}</p>
                                                <p className="text-xs text-zinc-500">{session.course?.title}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Training Docs */}
                    <Link href="/atco/trainings" className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/20 transition-all">
                        <BookOpen className="absolute -right-3 -bottom-3 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">TRAINING DOCS</h3>
                        <p className="text-blue-100 text-sm mb-4 opacity-90 leading-relaxed">Access official course materials.</p>
                        <div className="inline-block bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                            Open Library
                        </div>
                    </Link>
                </section>
            </div>
        </div>
    )
}

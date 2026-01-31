import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Users, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function AtcoDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch user profile and enrollments
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Fetch live upcoming sessions for the enrolled user
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

    const completedCount = typedEnrollments.filter(e => e.status === 'attended').length

    // Fetch OJTI assignments if user is an OJTI
    const { data: ojtiAssignments } = profile?.is_ojti
        ? await supabase
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
            .order('start_date', { ascending: true })
        : { data: [] }

    const typedOjtiAssignments = (ojtiAssignments as any[]) || []

    // New data structures needed for the provided JSX
    // Assuming 'sessions' is derived from 'upcomingSessions' or a similar source,
    // and 'assignment.instructor' is available in 'typedOjtiAssignments'.
    // For now, let's map existing data to fit the new JSX structure.
    const sessions = upcomingSessions.map(e => ({
        id: e.session.id,
        start_time: e.session.start_date,
        type: e.session.course.title,
        location: e.session.location,
    }));

    // Assuming ojtiAssignments now includes instructor details directly
    // For the new JSX, we need `assignment.instructor.username`
    const ojtiAssignmentsWithInstructor = typedOjtiAssignments.map(assignment => ({
        ...assignment,
        instructor: assignment.atco // Mapping 'atco' to 'instructor' for the new JSX structure
    }));


    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role={profile?.role || 'atco'} />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase leading-tight">HELLO, {profile?.full_name?.split(' ')[0] || 'ATCO'}</h2>
                        <p className="text-zinc-500 font-medium text-[13px] xl:text-base tracking-tight">Welcome back to your Training Zone dashboard.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            href="/api/atco/calendar"
                            className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 xl:py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-bold border border-zinc-700 active:scale-95"
                        >
                            <Calendar className="w-4 h-4" />
                            Sync to Calendar
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                    <section className="xl:col-span-2 space-y-8">
                        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-8 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    Upcoming Sessions
                                </h3>

                                {upcomingSessions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {upcomingSessions.map((enrollment) => (
                                            <div key={enrollment.session.id} className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-3xl hover:border-blue-500/30 transition-all group/card">
                                                <div className="flex items-center gap-3 mb-4 text-zinc-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(enrollment.session.start_date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="font-bold text-white mb-1">{enrollment.session.course.title}</p>
                                                <p className="text-xs text-zinc-500 font-medium mb-4">{enrollment.session.location?.name || 'TBD'}</p>
                                                <Link
                                                    href={`/atco/sessions/${enrollment.session.id}`}
                                                    className="inline-flex items-center gap-2 text-blue-500 text-[11px] font-bold hover:gap-3 transition-all uppercase tracking-wider"
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-zinc-950/30 rounded-3xl border border-dashed border-zinc-800">
                                        <p className="text-zinc-500 text-sm font-medium">No upcoming sessions scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-8 shadow-2xl">
                            <h3 className="text-xl font-bold mb-8">Training Pulse</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mb-1">Completed Units</p>
                                        <span className="text-5xl font-black text-white">{completedCount}</span>
                                    </div>
                                    <CheckCircle2 className="w-12 h-12 text-blue-500/20" />
                                </div>
                                <div className="pt-4 border-t border-zinc-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Yearly Goal</span>
                                        <span className="text-[10px] font-bold text-blue-500">{(completedCount / 10 * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                                            style={{ width: `${Math.min((completedCount / 10) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-600 mt-3 font-bold uppercase tracking-tight">
                                        Requirement: 10 specialized units per year
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-8">
                        {profile?.is_ojti && (
                            <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                                    <Users className="w-5 h-5 text-emerald-500" />
                                    OJTI Command
                                </h3>
                                {typedOjtiAssignments.length > 0 ? (
                                    <div className="space-y-3">
                                        {typedOjtiAssignments.map((session) => (
                                            <div key={session.id} className="p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500">
                                                        {session.atco?.username?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">{session.atco?.username}</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{session.course?.title}</p>
                                                    </div>
                                                </div>
                                                <Link href={`/atco/sessions/${session.id}`} className="text-zinc-600 group-hover:text-emerald-500 transition-colors">
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 text-sm py-8 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800">No active trainee assignments.</p>
                                )}
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 relative overflow-hidden group">
                            <BookOpen className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tighter">TRAINING DOCS</h3>
                            <p className="text-blue-100 text-[13px] mb-6 opacity-80 leading-relaxed font-medium">Access official course procedures and technical manuals.</p>
                            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl text-[13px] font-bold hover:shadow-lg transition-all active:scale-95">
                                Open Library
                            </button>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-8 group cursor-pointer hover:border-blue-500/30 transition-all">
                            <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Need Guidance?</h4>
                            <p className="text-sm text-zinc-500 font-medium mb-4">Contact the Training Command for session adjustments.</p>
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

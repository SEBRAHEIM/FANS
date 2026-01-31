import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Users, BookOpen } from 'lucide-react'

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

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role={profile?.role || 'atco'} />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase">HELLO, {profile?.full_name?.split(' ')[0] || 'ATCO'}</h2>
                        <p className="text-zinc-500 font-medium">Your specialized training overview for 2026.</p>
                    </div>
                    <a
                        href="/api/atco/calendar"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl border border-zinc-700 transition-all flex items-center gap-2 text-sm font-bold active:scale-95"
                    >
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Sync to Calendar
                    </a>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calendar className="w-32 h-32 text-white" />
                            </div>

                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Upcoming Sessions
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {upcomingSessions.map((enrollment) => (
                                    <div key={enrollment.session.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all backdrop-blur-sm group/item">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-lg text-white group-hover/item:text-blue-400 transition-colors uppercase tracking-tight">
                                                {enrollment.session.course.title}
                                            </h4>
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-500/20">
                                                {enrollment.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-6 text-sm font-medium">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Clock className="w-4 h-4 text-zinc-600" />
                                                {new Date(enrollment.session.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Users className="w-4 h-4 text-zinc-600" />
                                                {enrollment.session.instructor?.full_name || 'Assigned OJTI'}
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <MapPin className="w-4 h-4 text-zinc-600" />
                                                {enrollment.session.location.name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingSessions.length === 0 && (
                                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <AlertCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-zinc-500 font-medium">No upcoming sessions. Check the catalog to join.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold mb-8">Training Pulse</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-1">Completed</p>
                                        <span className="text-5xl font-black text-white">{completedCount}</span>
                                    </div>
                                    <CheckCircle2 className="w-12 h-12 text-blue-500/20" />
                                </div>

                                <div className="pt-4 border-t border-zinc-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Yearly Goal</span>
                                        <span className="text-xs font-bold text-blue-500">{(completedCount / 10 * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
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
                        </section>

                        <div className="bg-blue-600 rounded-3xl p-8 text-white group cursor-pointer hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/10">
                            <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Need Help?</h4>
                            <p className="text-sm text-blue-100 font-medium mb-4">Contact the training coordinator for session changes.</p>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform">
                                →
                            </div>
                        </div>
                    </div>
                </div>

                {profile?.is_ojti && (
                    <section className="mt-12">
                        <header className="mb-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                Assigned as OJTI
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                OJTI PRIVILEGES ACTIVE
                            </span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {typedOjtiAssignments.map((session) => (
                                <div key={session.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Trainee Controller</p>
                                            <h4 className="font-bold text-white uppercase">{session.atco?.full_name || session.atco?.username}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-xs font-bold text-zinc-300 uppercase">{session.status}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-3 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                                            <BookOpen className="w-4 h-4 text-zinc-600" />
                                            {session.course?.title}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                                            <Calendar className="w-4 h-4 text-zinc-600" />
                                            {new Date(session.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {typedOjtiAssignments.length === 0 && (
                                <div className="col-span-full py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-500">
                                    <Users className="w-8 h-8 opacity-20 mb-3" />
                                    <p className="text-sm font-medium">No active training assignments found.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}

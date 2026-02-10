import { createClient } from '@/lib/supabase/server'
import {
    User,
    BookOpen,
    Calendar,
    FileText,
    ShieldCheck,
    ChevronRight,
    Clock,
    CheckCircle2,
    GraduationCap,
    TrendingUp,
    MapPin
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AtcoProfilePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!profile) notFound()

    // 2. Fetch Assignments & Progress
    const { data: assignments } = await supabase
        .from('course_assignments')
        .select(`
            *,
            course:course_id(title, description, version)
        `)
        .eq('user_id', params.id)

    // 3. Fetch Exam History (using the view)
    const { data: results } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_name', profile.full_name) // Ideally this should be by student_id if the view supports it
        .order('completed_at', { ascending: false })

    // 4. Fetch Upcoming Sessions
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            *,
            course:course_id(title),
            location:location_id(name),
            ojti:ojti_id(full_name)
        `)
        .eq('atco_id', params.id)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto pb-32">
            {/* Header / Profile Breadcrumb */}
            <header className="mb-12 border-b border-white/5 pb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 shadow-2xl">
                            <User className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">
                                {profile.full_name}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">IDENT 00{profile.id.slice(0, 4).toUpperCase()}</span>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${profile.is_ojti ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
                                    }`}>
                                    {profile.is_ojti ? 'Certified OJTI' : 'Standard ATCO'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/officer/planning?atcoId=${profile.id}`} className="bg-white text-zinc-950 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl hover:bg-blue-500 hover:text-white">
                            Schedule Session
                        </Link>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Active Assignments */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <GraduationCap className="w-6 h-6 text-blue-500" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Assigned Certification Tracks</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {assignments?.map((asgn) => (
                                <div key={asgn.id} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/30 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-all">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">{asgn.course?.title}</p>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Version {asgn.course?.version || '1.0'} • Due {new Date(asgn.due_date || asgn.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-2 rounded-full bg-blue-500/10 text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20">
                                        In Progress
                                    </span>
                                </div>
                            ))}
                            {(!assignments || assignments.length === 0) && (
                                <div className="p-12 border border-dashed border-white/5 rounded-[2rem] text-center">
                                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px]">No active assignments</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Examination History */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Qualification Registry</h3>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Track</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Score</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {results?.map((res) => (
                                        <tr key={res.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-white text-sm">{res.course_title}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-sm font-black ${res.score_percentage && res.score_percentage >= 80 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                    {res.score_percentage}%
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-zinc-500 font-medium">
                                                {new Date(res.completed_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link href={`/officer/results?search=${profile.full_name}`} className="text-zinc-600 hover:text-white">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!results || results.length === 0) && (
                                <div className="p-16 text-center">
                                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px]">No records found</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Progress Summary */}
                    <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Performance Pulse</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Pass Rate</p>
                                <p className="text-2xl font-black text-white">
                                    {results?.length ? Math.round((results.filter(r => (r.score_percentage || 0) >= 80).length / results.length) * 100) : 0}%
                                </p>
                            </div>
                            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Certs Issued</p>
                                <p className="text-2xl font-black text-white">{results?.length || 0}</p>
                            </div>
                        </div>
                    </section>

                    {/* Upcoming Deployments */}
                    <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Upcoming Cycles</h4>
                        </div>
                        <div className="space-y-3">
                            {sessions?.map((session) => (
                                <div key={session.id} className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-white uppercase tracking-tight">{session.course?.title || 'Training'}</p>
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{new Date(session.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                        <MapPin className="w-3 h-3" />
                                        {session.location?.name || 'Unassigned Site'}
                                    </div>
                                </div>
                            ))}
                            {(!sessions || sessions.length === 0) && (
                                <p className="text-center py-8 text-zinc-700 font-black text-[10px] uppercase tracking-widest italic">No deployments scheduled</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

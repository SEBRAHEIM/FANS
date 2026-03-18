import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen, CheckCircle, Clock, ChevronRight, Award, FileText, Calendar } from 'lucide-react'

export default async function ATCOProfilePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: atco, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

    if (profileError || !atco) notFound()

    // Fetch assigned courses
    const { data: assignments } = await supabase
        .from('assignments')
        .select(`
            *,
            course:courses(title, description, status)
        `)
        .eq('atco_id', params.id)

    // Fetch results
    const { data: results } = await supabase
        .from('results')
        .select(`
            *,
            course:courses(title),
            assessment:assessments(title)
        `)
        .eq('atco_id', params.id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 max-w-6xl">
            <header className="mb-12 border-b border-white/5 pb-10">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/officer/atcos" className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                        Personnel Command
                    </Link>
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                    <span className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">ATCO Profile</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20">
                            {atco.initials || atco.full_name?.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${atco.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        atco.role === 'TRAINING_OFFICER' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            atco.is_ojti ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                    }`}>
                                    {atco.is_ojti ? 'OJTI / ' : ''}{atco.role}
                                </span>
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">ID: {atco.id.slice(0, 8)}</p>
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{atco.full_name}</h1>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{atco.email}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest border border-white/5">
                            <Calendar className="w-5 h-5" />
                            Schedule Session
                        </button>
                        {/* <button className="flex-1 md:flex-none bg-blue-600 text-white hover:bg-blue-500 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                            <BookOpen className="w-5 h-5" />
                            Assign Training
                        </button> */}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                            <Award className="w-5 h-5 text-emerald-500" />
                            Current Training Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assignments && assignments.length > 0 ? (
                                assignments.map((assignment: any) => (
                                    <div key={assignment.id} className="p-8 bg-zinc-900/40 border border-white/5 rounded-3xl space-y-4 group hover:border-blue-500/30 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${assignment.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    assignment.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'
                                                }`}>
                                                {assignment.status}
                                            </span>
                                            {assignment.mandatory && (
                                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Mandatory</span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-500 transition-colors">{assignment.course?.title}</h4>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Due: {assignment.due_date || 'N/A'}</span>
                                            </div>
                                            <Link href={`/officer/courses/${assignment.course_id}`} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                                                View Course →
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full p-16 border border-dashed border-white/5 rounded-[2.5rem] text-center">
                                    <BookOpen className="w-8 h-8 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">No active training assignments recorded</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            Certification History
                        </h3>
                        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Course / Assessment</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Score</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results && results.length > 0 ? (
                                        results.map((result: any) => (
                                            <tr key={result.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{result.course?.title}</p>
                                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{result.assessment?.title}</p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`text-lg font-black ${result.pass ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {result.score}%
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                        {new Date(result.created_at).toLocaleDateString()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-16 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                                No certification records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="space-y-12">
                    <section className="p-8 bg-zinc-900/60 border border-white/5 rounded-[2.5rem] space-y-8">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Operational Meta</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Deep Personnel Data</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Qualifications</p>
                                <div className="flex flex-wrap gap-2">
                                    {['RADAR', 'TOWER', 'GND'].map(q => (
                                        <span key={q} className="px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md text-[8px] font-black tracking-widest">{q}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-3">
                                <button className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-center text-white uppercase tracking-widest transition-all">
                                    Edit Clearance Level
                                </button>
                                <button className="w-full p-4 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-2xl text-[10px] font-black text-center text-emerald-500 uppercase tracking-widest transition-all">
                                    Promote to OJTI
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

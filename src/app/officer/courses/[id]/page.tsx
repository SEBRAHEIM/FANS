import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Edit, Users, FileText, ChevronRight, Play, Archive, CheckCircle } from 'lucide-react'

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            owner:profiles(full_name),
            modules(*),
            assessments(*)
        `)
        .eq('id', params.id)
        .single()

    if (error || !course) notFound()

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 max-w-6xl">
            <header className="mb-12 border-b border-white/5 pb-10">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/officer/content" className="text-zinc-500 hover:text-white transition-colors">
                        Training Catalog
                    </Link>
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                    <span className="text-zinc-300 font-bold uppercase tracking-widest text-[10px]">Course Command</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${course.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    course.status === 'DRAFT' ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' :
                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                {course.status}
                            </span>
                            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Version {course.version}.0</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">{course.title}</h1>
                        <p className="text-zinc-500 max-w-2xl text-[13px] leading-relaxed italic">{course.description || 'No operational description provided.'}</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <Link
                            href={`/officer/content?edit=${course.id}`}
                            className="flex-1 md:flex-none bg-blue-600 text-white hover:bg-blue-500 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
                        >
                            <Edit className="w-5 h-5" />
                            Launch Builder
                        </Link>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                                Course Assets
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {course.modules.length > 0 ? (
                                course.modules.sort((a: any, b: any) => a.order_index - b.order_index).map((module: any, i: number) => (
                                    <div key={module.id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="text-[10px] font-black text-zinc-700 w-4">{(i + 1).toString().padStart(2, '0')}</div>
                                            <div>
                                                <p className="text-md font-black text-white uppercase tracking-tight group-hover:text-blue-500 transition-colors">{module.title}</p>
                                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-1">Operational Module • Content Persisted</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 border border-dashed border-white/5 rounded-2xl text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                    No modules deployed to this course asset
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-500" />
                                Assessments
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {course.assessments.length > 0 ? (
                                course.assessments.map((assessment: any) => (
                                    <div key={assessment.id} className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-md font-black text-white uppercase tracking-tight">{assessment.title}</p>
                                            <div className="flex gap-4 mt-2">
                                                <p className="text-[9px] text-emerald-500/60 uppercase tracking-widest font-black">Pass Mark: {assessment.pass_mark}%</p>
                                                <p className="text-[9px] text-emerald-500/60 uppercase tracking-widest font-black">Limit: {assessment.time_limit_minutes}m</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500 text-[9px] font-black text-black rounded-lg uppercase tracking-widest">Active</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 border border-dashed border-white/5 rounded-2xl text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                    No assessment protocols linked
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-12">
                    <section className="p-8 bg-zinc-900/60 border border-white/5 rounded-[2.5rem] space-y-8">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Meta Command</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Asset Lifecycle Data</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Owner / Deployer</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-[10px] font-black">
                                        {course.owner?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <span className="text-[11px] font-bold text-white uppercase">{course.owner?.full_name}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Deployed At</p>
                                <span className="text-[11px] font-bold text-zinc-300 uppercase">
                                    {course.published_at ? new Date(course.published_at).toLocaleDateString() : 'Draft Status'}
                                </span>
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-3">
                                <button className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-center text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Assign Personnel
                                </button>
                                <button className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-[10px] font-black text-center text-red-500 uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <Archive className="w-4 h-4" />
                                    Archive Asset
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

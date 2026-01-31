import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Users, Calendar, BookOpen, Clock, Plus, MapPin, CheckSquare } from 'lucide-react'
import Link from 'next/link'

export default async function OfficerDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch stats for the officer
    const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })

    const { count: pendingAssignments } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .is('ojti_id', null)

    const { count: pendingGrades } = await supabase
        .from('student_responses')
        .select('*', { count: 'exact', head: true })
        .is('is_correct', null)

    const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-white">
                            OFFICER COMMAND
                        </h2>
                        <p className="text-zinc-500 font-medium text-[13px] lg:text-base tracking-tight">
                            Manage OJTIs, ATCO assignments, and course materials.
                        </p>
                    </div>
                    <Link
                        href="/officer/planning"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 xl:py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-[13px] font-bold shadow-lg shadow-blue-500/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        New Session
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-10 text-zinc-100">
                    <Link href="/officer/planning" className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.98]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500 uppercase tracking-widest border border-blue-500/20">
                                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                LIVE
                            </span>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Active Sessions</p>
                        <span className="text-4xl xl:text-6xl font-black tracking-tighter">{totalSessions || 0}</span>
                    </Link>

                    <Link href="/officer/assignments" className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-[2.5rem] group hover:border-orange-500/30 transition-all active:scale-[0.98]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Needs OJTI</p>
                        <span className="text-4xl xl:text-6xl font-black tracking-tighter text-orange-500">{pendingAssignments || 0}</span>
                    </Link>

                    <Link href="/officer/grading" className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-[2.5rem] group hover:border-emerald-500/30 transition-all active:scale-[0.98]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            {pendingGrades && pendingGrades > 0 ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    {pendingGrades} PENDING
                                </span>
                            ) : null}
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Manual Grading</p>
                        <span className="text-4xl xl:text-6xl font-black tracking-tighter text-emerald-500">{pendingGrades || 0}</span>
                    </Link>

                    <Link href="/officer/content" className="bg-zinc-900 border border-zinc-800/50 p-8 rounded-[2.5rem] md:col-span-2 xl:col-span-1 group hover:border-purple-500/30 transition-all active:scale-[0.98]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                <BookOpen className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Video Courses</p>
                        <span className="text-4xl xl:text-6xl font-black tracking-tighter text-zinc-600">{courseCount || 0}</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    <section className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-6 lg:p-10">
                        <h3 className="text-lg lg:text-xl font-bold mb-8 flex items-center gap-3 text-white">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-3 lg:gap-4">
                            <Link href="/officer/assignments" className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm lg:text-base">Personnel & OJTIs</p>
                                        <p className="text-[11px] lg:text-xs text-zinc-500 font-medium">Manage list and flag OJTI status</p>
                                    </div>
                                </div>
                                <span className="text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">→</span>
                            </Link>

                            <Link href="/officer/planning" className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm lg:text-base">Training Schedule</p>
                                        <p className="text-[11px] lg:text-xs text-zinc-500 font-medium">Create or edit training events</p>
                                    </div>
                                </div>
                                <span className="text-zinc-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">→</span>
                            </Link>

                            <Link href="/officer/content" className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm lg:text-base">Course Catalog</p>
                                        <p className="text-[11px] lg:text-xs text-zinc-500 font-medium">Add courses and COC exams</p>
                                    </div>
                                </div>
                                <span className="text-zinc-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all">→</span>
                            </Link>

                            <Link href="/officer/locations" className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-orange-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm lg:text-base">Site Locations</p>
                                        <p className="text-[11px] lg:text-xs text-zinc-500 font-medium">Manage Tower and Center sites</p>
                                    </div>
                                </div>
                                <span className="text-zinc-700 group-hover:text-orange-500 group-hover:translate-x-1 transition-all">→</span>
                            </Link>
                        </div>
                    </section>

                    <section className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-6 lg:p-10 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg lg:text-xl font-bold text-white">Recent Activity</h3>
                            <Link href="/officer/logs" className="text-blue-500 text-[11px] font-bold hover:underline uppercase tracking-widest">
                                View Logs
                            </Link>
                        </div>
                        <Link href="/officer/logs" className="flex-1 flex flex-col items-center justify-center py-12 bg-zinc-950/30 rounded-3xl border border-zinc-800/50 border-dashed group hover:border-blue-500/30 transition-all cursor-pointer">
                            <Clock className="w-8 h-8 text-zinc-800 group-hover:text-blue-500 transition-colors mb-3" />
                            <p className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-[13px] font-medium tracking-tight">
                                No recent command activity.
                            </p>
                        </Link>
                    </section>
                </div>
            </main>
        </div>
    )
}

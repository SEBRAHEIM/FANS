import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Users, Calendar, BookOpen, Clock, Plus, MapPin } from 'lucide-react'
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
        .is('instructor_id', null)

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-10 pt-24 xl:pt-10">
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl lg:text-3xl font-black tracking-tighter uppercase leading-none text-white">
                            OFFICER COMMAND
                        </h2>
                        <p className="text-zinc-500 font-medium text-[13px] lg:text-base tracking-tight">
                            Manage OJTIs, ATCO assignments, and course materials.
                        </p>
                    </div>
                    <Link
                        href="/officer/planning"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 lg:py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-[13px] font-bold shadow-lg shadow-blue-500/25 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Session
                    </Link>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-10 text-zinc-100">
                    <div className="bg-zinc-900 border border-zinc-800/50 p-6 rounded-[2rem] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-500 uppercase tracking-widest border border-blue-500/20">
                                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                LIVE
                            </span>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Active Sessions</p>
                        <span className="text-4xl lg:text-5xl font-black tracking-tighter">{totalSessions || 0}</span>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800/50 p-6 rounded-[2rem] group hover:border-orange-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500/70">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Needs OJTI</p>
                        <span className="text-4xl lg:text-5xl font-black tracking-tighter text-orange-500">{pendingAssignments || 0}</span>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800/50 p-6 rounded-[2rem] sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-500/70">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Video Courses</p>
                        <span className="text-4xl lg:text-5xl font-black tracking-tighter text-zinc-400">--</span>
                    </div>
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

                    <section className="bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem] p-6 lg:p-10">
                        <h3 className="text-lg lg:text-xl font-bold mb-8 text-white">Recent Activity</h3>
                        <div className="flex flex-col items-center justify-center py-12 bg-zinc-950/30 rounded-3xl border border-zinc-800/50 border-dashed">
                            <Clock className="w-8 h-8 text-zinc-800 mb-3" />
                            <p className="text-zinc-600 text-[13px] font-medium tracking-tight">
                                No recent command activity.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

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
        <div className="flex flex-col lg:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-4 lg:p-8">
                <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase leading-tight">OFFICER COMMAND</h2>
                        <p className="text-zinc-500 font-medium text-sm lg:text-base">Manage OJTIs, ATCO assignments, and course materials.</p>
                    </div>
                    <Link
                        href="/officer/planning"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Session
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center gap-4 mb-2 text-zinc-500">
                            <Calendar className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Active Sessions</span>
                        </div>
                        <span className="text-3xl lg:text-4xl font-black">{totalSessions || 0}</span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center gap-4 mb-2 text-orange-500">
                            <Users className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Needs OJTI</span>
                        </div>
                        <span className="text-4xl font-black">{pendingAssignments || 0}</span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center gap-4 mb-2 text-blue-500">
                            <BookOpen className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Video Courses</span>
                        </div>
                        <span className="text-4xl font-black">--</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <Link href="/officer/assignments" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Personnel & OJTIs</p>
                                        <p className="text-xs text-zinc-500">Manage ATCO list and flag OJTI status</p>
                                    </div>
                                </div>
                                <span className="text-zinc-600 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>

                            <Link href="/officer/planning" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Training Schedule</p>
                                        <p className="text-xs text-zinc-500">Create, edit, or cancel training events</p>
                                    </div>
                                </div>
                                <span className="text-zinc-600 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>

                            <Link href="/officer/content" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Course Catalog</p>
                                        <p className="text-xs text-zinc-500">Add or edit courses and COC exams</p>
                                    </div>
                                </div>
                                <span className="text-zinc-600 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>

                            <Link href="/officer/locations" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Site Locations</p>
                                        <p className="text-xs text-zinc-500">Manage Tower, Center, and other sites</p>
                                    </div>
                                </div>
                                <span className="text-zinc-600 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </section>

                    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                        <div className="space-y-4">
                            <p className="text-zinc-500 text-sm text-center py-8 bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-800">
                                No recent activity to show.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

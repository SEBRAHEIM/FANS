import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, BookOpen, Clock, Plus, MapPin, CheckSquare, FileText } from 'lucide-react'
import Link from 'next/link'

import { Suspense } from 'react'
import StatsCards, { StatsSkeleton } from './components/StatsCards'

export default async function OfficerDashboard() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none text-white">
                        OFFICER COMMAND
                    </h2>
                    <p className="text-zinc-500 font-medium text-[12px] sm:text-[13px] lg:text-base tracking-tight">
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

            <Suspense fallback={<StatsSkeleton />}>
                <StatsCards />
            </Suspense>

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
        </div>
    )
}

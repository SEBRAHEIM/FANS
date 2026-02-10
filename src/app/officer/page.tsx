import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, BookOpen, Clock, Plus, MapPin, CheckSquare, FileText } from 'lucide-react'
import Link from 'next/link'

import { Suspense } from 'react'
import StatsCards, { StatsSkeleton } from './components/StatsCards'

export default async function OfficerDashboard() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                        Dashboard
                    </h2>
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Operational Status: Nominal
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Link
                        href="/officer/content"
                        className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-95"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Create Course
                    </Link>
                    <Link
                        href="/officer/assignments"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest border border-white/10 active:scale-95"
                    >
                        <Users className="w-5 h-5 stroke-[3px]" />
                        Assign Training
                    </Link>
                </div>
            </header>

            <Suspense fallback={<StatsSkeleton />}>
                <StatsCards />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Operations</h3>
                                <p className="text-zinc-500 text-xs font-medium">Ongoing training sessions and simulator slots.</p>
                            </div>
                            <Link href="/officer/planning" className="text-blue-500 text-[10px] font-black hover:underline uppercase tracking-[0.2em]">
                                Full Schedule →
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 bg-zinc-950/50 border border-white/5 rounded-3xl flex items-center justify-between group/item hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white uppercase tracking-tight">Tower Refresher Session</p>
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-black">Room 402 • 14:00 - 16:00</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20">
                                    In Progress
                                </span>
                            </div>

                            <div className="p-6 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl py-12">
                                <Clock className="w-8 h-8 text-zinc-800 mb-2" />
                                <p className="text-zinc-600 text-[11px] font-black uppercase tracking-widest">No other sessions today</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">System Logs</h3>
                        <Link href="/officer/logs" className="text-zinc-500 hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500/40" />
                                <div className="space-y-1">
                                    <p className="text-[12px] text-zinc-300 font-medium">Course "LVP Procedures" was published by Admin</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link href="/officer/logs" className="mt-8 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black text-center text-zinc-400 uppercase tracking-[0.2em] transition-all">
                        View Audit Trail
                    </Link>
                </section>
            </div>
        </div>
    )
}

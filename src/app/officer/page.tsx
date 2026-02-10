import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, BookOpen, Clock, Plus, MapPin, CheckSquare, FileText } from 'lucide-react'
import Link from 'next/link'

import { Suspense } from 'react'
import StatsCards, { StatsSkeleton } from './components/StatsCards'

export default async function OfficerDashboard() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                        Command Center
                    </h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Operational Oversight & Personnel Deployment</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Link
                        href="/officer/content"
                        className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-95"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Deploy New Course
                    </Link>
                </div>
            </header>

            <Suspense fallback={<StatsSkeleton />}>
                <StatsCards />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Deployment Queue</h3>
                                <p className="text-zinc-500 text-xs font-medium">Ongoing training sessions and simulator slots.</p>
                            </div>
                            <Link href="/officer/planning" className="text-blue-500 text-[10px] font-black hover:underline uppercase tracking-[0.2em]">
                                Full Command Schedule →
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {/* Fetch real ongoing sessions here or in a sub-component */}
                            <div className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2rem] flex items-center justify-between group/item hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Clock className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white uppercase tracking-tight">System Nominal</p>
                                        <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-black">All active cycles currently being logged</p>
                                    </div>
                                </div>
                                <Link href="/officer/planning" className="px-5 py-2.5 rounded-full bg-blue-500/10 text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">
                                    Manage Sessions
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Platform Audit</h3>
                        <Link href="/officer/results" className="text-zinc-500 hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="p-6 bg-zinc-950/40 border border-white/5 rounded-[2rem] space-y-4">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Recent Activity</p>
                            <div className="space-y-3">
                                <div className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500" />
                                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight">System tracking initialized</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

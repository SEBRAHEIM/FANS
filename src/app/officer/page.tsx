import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, BookOpen, Clock, Plus, MapPin, CheckSquare, FileText } from 'lucide-react'
import Link from 'next/link'

import { Suspense } from 'react'
import StatsCards, { StatsSkeleton } from './components/StatsCards'

export default async function OfficerDashboard() {
    const supabase = await createClient()

    // Fetch latest 10 logs
    const { data: latestLogs } = await supabase
        .from('audit_logs')
        .select(`
            *,
            actor:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    // Fetch ongoing assignments (Active cycles)
    const { data: activeCycles } = await supabase
        .from('assignments')
        .select(`
            *,
            atco:profiles(full_name),
            course:courses(title)
        `)
        .eq('status', 'IN_PROGRESS')
        .limit(3)

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
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Cycles</h3>
                                <p className="text-zinc-500 text-xs font-medium">Ongoing training sessions currently in progress.</p>
                            </div>
                            <Link href="/officer/atcos?filter=active" className="text-blue-500 text-[10px] font-black hover:underline uppercase tracking-[0.2em]">
                                Full Deployment View →
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {activeCycles && activeCycles.length > 0 ? (
                                activeCycles.map((cycle: any) => (
                                    <div key={cycle.id} className="p-6 bg-zinc-950/40 border border-white/5 rounded-[2rem] flex items-center justify-between group/item hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-md font-black text-white uppercase tracking-tight">{cycle.atco?.full_name}</p>
                                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">{cycle.course?.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">In Progress</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem]">
                                    <Clock className="w-8 h-8 text-zinc-800 mb-4" />
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest text-center">No active training cycles detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">System Audit</h3>
                        <Link href="/officer/audit" className="text-zinc-500 hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="p-6 bg-zinc-950/40 border border-white/5 rounded-[2rem] space-y-6">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Latest Activity</p>
                            <div className="space-y-4">
                                {latestLogs && latestLogs.length > 0 ? (
                                    latestLogs.map((log: any) => (
                                        <div key={log.id} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                            <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight leading-relaxed">
                                                    <span className="text-white">{log.actor?.full_name}</span> {log.action.replace(/_/g, ' ').toLowerCase()}d {log.entity_type.toLowerCase()}
                                                </p>
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest text-center py-8">No recent logs recorded</p>
                                )}
                            </div>
                        </div>
                        <Link href="/officer/audit" className="mt-auto p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black text-center text-zinc-500 uppercase tracking-widest transition-all">
                            View Full Audit Trail
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    )
}

import { Suspense } from 'react'
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import AtcoHeader, { AtcoHeaderSkeleton } from './components/AtcoHeader'
import UpcomingSessions, { UpcomingSessionsSkeleton } from './components/UpcomingSessions'
import AtcoStats, { AtcoStatsSkeleton } from './components/AtcoStats'

export default async function AtcoDashboard() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <Suspense fallback={<AtcoHeaderSkeleton />}>
                <AtcoHeader />
            </Suspense>

            <Suspense fallback={<AtcoStatsSkeleton />}>
                <AtcoStats />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <section className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Training</h3>
                        <Link href="/atco/trainings" className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] hover:underline">
                            All Courses →
                        </Link>
                    </div>

                    <Suspense fallback={<UpcomingSessionsSkeleton />}>
                        <UpcomingSessions />
                    </Suspense>
                </section>

                <section className="space-y-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Recent Progress</h3>
                    <div className="glass rounded-[2.5rem] p-8 space-y-6">
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <p className="font-bold text-sm text-white leading-tight">Emergency Procedures v2</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="h-1.5 flex-1 bg-zinc-950 rounded-full mr-4 overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[65%]" />
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">65%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link href="/atco/trainings" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Resume Learning</span>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>

                    {/* Official Library Link */}
                    <Link href="/atco/trainings" className="block bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all">
                        <BookOpen className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-black text-white mb-3 tracking-tight uppercase">Manuals & SOPs</h3>
                        <p className="text-zinc-500 text-[12px] mb-6 font-medium leading-relaxed">Access the official FANS training manuals and simulator guidelines.</p>
                        <div className="inline-block bg-white text-black px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                            Open Catalog
                        </div>
                    </Link>
                </section>
            </div>
        </div>
    )
}

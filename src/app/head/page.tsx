import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Shield, Users, Calendar, BarChart3, TrendingUp, AlertCircle } from 'lucide-react'

export default async function HeadDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Global Stats
    const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: completedTrainings } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'attended')
    const { count: scheduledSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="head_of_training" />
            <main className="flex-1 min-w-0 p-8">
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-blue-600/20 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase">SUPERVISION HUB</h2>
                    </div>
                    <p className="text-zinc-500 font-medium text-lg">Global oversight for FANS training operations.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Personnel', value: activeUsers, icon: Users, color: 'text-blue-500' },
                        { label: 'Completed Units', value: completedTrainings, icon: BarChart3, color: 'text-emerald-500' },
                        { label: 'Upcoming sessions', value: scheduledSessions, icon: Calendar, color: 'text-orange-500' },
                        { label: 'Compliance Rate', value: '94%', icon: TrendingUp, color: 'text-purple-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group hover:border-zinc-700 transition-all">
                            <stat.icon className={`w-5 h-5 mb-4 ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
                            <span className="text-4xl font-black">{stat.value || 0}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-8 flex justify-between items-center">
                            Operational Health
                            <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">All Systems Normal</span>
                        </h3>

                        <div className="space-y-6">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-xl text-zinc-500">
                                        0{i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold">Quarterly Refresher Course Plan</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Q1 2026</span>
                                            <span className="text-xs text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3" /> 140 ATCOs</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">In Planning</p>
                                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="w-2/3 h-full bg-blue-600" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-8">Strategic Alerts</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex gap-4">
                                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-orange-200">License Expiry Warning</p>
                                    <p className="text-xs text-orange-500/70 mt-1">12 ATCOs have recurrent training due in the next 30 days.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

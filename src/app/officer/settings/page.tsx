'use client'

import { Settings, Bell, Shield, Palette, Zap, Globe, Cpu } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">SYSTEM CONFIG</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Platform Calibration & Operational Tuning</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Signal Protocol</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Notification & Alert Management</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Evaluation Submitted', status: true },
                            { label: 'Session Conflict Alert', status: true },
                            { label: 'System Update Signal', status: false }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{item.label}</span>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.status ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.status ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Security Array</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Access Control & Data Integrity</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Role-Based Confinement', status: true },
                            { label: 'Audit Log Persistence', status: true },
                            { label: 'Two-Factor Authentication', status: true }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{item.label}</span>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.status ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.status ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] space-y-8 md:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100/10 flex items-center justify-center text-zinc-100">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Deployment Modes</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Platform Operational Profiles</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: Globe, label: 'Global Fleet', desc: 'Standard production environment' },
                            { icon: Cpu, label: 'Simulator Core', desc: 'Optimized for high-latency ops' },
                            { icon: Shield, label: 'Command Shield', desc: 'Maximum security lockdown' }
                        ].map((item, i) => (
                            <div key={i} className={`p-8 rounded-[2rem] border transition-all cursor-pointer group ${i === 0 ? 'bg-zinc-100 border-zinc-100' : 'bg-transparent border-white/5 hover:border-white/20'}`}>
                                <item.icon className={`w-8 h-8 mb-6 ${i === 0 ? 'text-zinc-950' : 'text-zinc-500 group-hover:text-white'}`} />
                                <h4 className={`text-md font-black uppercase tracking-tighter ${i === 0 ? 'text-zinc-950' : 'text-white'}`}>{item.label}</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${i === 0 ? 'text-zinc-700' : 'text-zinc-500'}`}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

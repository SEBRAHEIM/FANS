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
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Access Control</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">RBAC & Data Persistence</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { id: 'audit_logs', label: 'Persistence Logging', desc: 'Ensures every action creates a verifiable audit record.', status: true },
                            { id: 'strict_mode', label: 'Strict Access Control', desc: 'Enforces role-based isolation at the DB level.', status: true },
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-zinc-950/50 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">{item.label}</span>
                                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${item.status ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.status ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100/10 flex items-center justify-center text-white">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">System Deployment</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Operational Profile Selection</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { icon: Globe, label: 'Operational Fleet', desc: 'Live training environment with full persistence.' },
                            { icon: Cpu, label: 'Simulator Core', desc: 'Restricted mode for high-latency simulation.' }
                        ].map((item, i) => (
                            <div key={i} className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center gap-6 ${i === 0 ? 'bg-white border-white text-zinc-950 shadow-xl' : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20'}`}>
                                <item.icon className={`w-8 h-8 ${i === 0 ? 'text-zinc-950' : 'text-zinc-500'}`} />
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest">{item.label}</h4>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${i === 0 ? 'text-zinc-700' : 'text-zinc-500'}`}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

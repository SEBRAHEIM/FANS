'use client'

import { useState } from 'react'
import { Shield, Zap, Globe, Cpu, AlertCircle, Save, FileText, Lock } from 'lucide-react'

export default function SettingsPage() {
    const [auditEnabled, setAuditEnabled] = useState(true)
    const [strictMode, setStrictMode] = useState(true)
    const [envMode, setEnvMode] = useState<'operational' | 'simulator'>('operational')
    const [saving, setSaving] = useState(false)

    const handleSave = () => {
        setSaving(true)
        setTimeout(() => setSaving(false), 1000)
    }

    return (
        <div className="p-6 md:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">SYSTEM CONFIG</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Platform Calibration & Operational Tuning</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'SYNCING...' : 'COMMIT CHANGES'}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Security Controls */}
                <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Access & Security</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Enforce RBAC & Data Integrity</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div onClick={() => setAuditEnabled(!auditEnabled)} className="p-8 bg-zinc-950/60 rounded-[2rem] border border-white/5 space-y-4 cursor-pointer hover:border-blue-500/20 transition-all group">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-zinc-600 group-hover:text-blue-500" />
                                    <span className="text-sm font-black text-white uppercase tracking-tight">System Audit Pipeline</span>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-all ${auditEnabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${auditEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-loose italic">Ensures every system action (Module completion, Course Publish) generates a verified record.</p>
                        </div>

                        <div onClick={() => setStrictMode(!strictMode)} className="p-8 bg-zinc-950/60 rounded-[2rem] border border-white/5 space-y-4 cursor-pointer hover:border-blue-500/20 transition-all group">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-4 h-4 text-zinc-600 group-hover:text-blue-500" />
                                    <span className="text-sm font-black text-white uppercase tracking-tight">Strict RLS Enforcement</span>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-all ${strictMode ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${strictMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-loose italic">Enforces database-level isolation between Officers and ATCO personnel.</p>
                        </div>
                    </div>
                </section>

                {/* Deployment Controls */}
                <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100/10 flex items-center justify-center text-white border border-white/10">
                            <Zap className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Environment Mode</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Operational Deployment Profile</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div
                            onClick={() => setEnvMode('operational')}
                            className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-8 ${envMode === 'operational' ? 'bg-white border-white text-zinc-950 shadow-2xl scale-[1.02]' : 'bg-zinc-950/40 border-white/5 text-zinc-500'}`}
                        >
                            <Globe className={`w-10 h-10 ${envMode === 'operational' ? 'text-blue-600' : 'text-zinc-700'}`} />
                            <div>
                                <h4 className="text-lg font-black uppercase tracking-tight">Operational Fleet</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 italic">Full persistence enabled. Mission-critical mode.</p>
                            </div>
                        </div>

                        <div
                            onClick={() => setEnvMode('simulator')}
                            className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-8 ${envMode === 'simulator' ? 'bg-white border-white text-zinc-950 shadow-2xl scale-[1.02]' : 'bg-zinc-950/40 border-white/5 text-zinc-500'}`}
                        >
                            <Cpu className={`w-10 h-10 ${envMode === 'simulator' ? 'text-amber-500' : 'text-zinc-700'}`} />
                            <div>
                                <h4 className="text-lg font-black uppercase tracking-tight">Simulator Core</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 italic">Restricted data mode. Optimized for high-latency ops.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex gap-4">
                        <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-loose italic">Switching environment modes will require all active ATCO sessions to re-authenticate for security synchronization.</p>
                    </div>
                </section>
            </div>
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Search, MoreVertical, Plus, UserPlus, Shield, Award } from 'lucide-react'

export default async function ATCOManagementPage() {
    const supabase = await createClient()

    const { data: atcos, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                        ATCO Management
                    </h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Personnel Oversight & Qualification Records</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-95">
                        <UserPlus className="w-5 h-5 stroke-[3px]" />
                        Onboard ATCO
                    </button>
                </div>
            </header>

            <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME, ID, OR CALLSIGN..."
                            className="w-full bg-zinc-950 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        {['ALL', 'ATCO', 'OJTI', 'ADMIN'].map(role => (
                            <button key={role} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Personnel</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Designation</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {atcos && atcos.length > 0 ? (
                                atcos.map((atco: any) => (
                                    <tr key={atco.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <Link href={`/officer/atcos/${atco.id}`} className="flex items-center gap-4 group/link">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-xs group-hover/link:bg-blue-500 group-hover/link:text-white transition-all">
                                                    {atco.initials || atco.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white hover:text-blue-500 transition-colors uppercase tracking-tight">{atco.full_name}</p>
                                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{atco.email}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {atco.role === 'ADMIN' ? <Shield className="w-3.5 h-3.5 text-red-500" /> : <Award className="w-3.5 h-3.5 text-blue-500" />}
                                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{atco.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full ${atco.is_ojti ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{atco.is_ojti ? 'OJTI ACTIVE' : 'STANDARD'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/officer/atcos/${atco.id}`} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">
                                                    Manage Profile
                                                </Link>
                                                <button className="p-2 text-zinc-700 hover:text-white transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                        No personnel objects found in data registry
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

import Link from 'next/link'
import { FileText, Plus, ClipboardCheck, ArrowRight } from 'lucide-react'

export default function FormsPortalPage() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white leading-none">FORMS PORTAL</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Training & Assessment Documentation Hub</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* OJT Assessment Card */}
                <Link href="/officer/ojt/new" className="group relative bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] hover:bg-zinc-900/80 transition-all hover:border-blue-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors" />
                    
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ClipboardCheck className="w-7 h-7" />
                        </div>
                        
                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">011 ATCO TA Form</h3>
                        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                            Create a detailed On-the-Job Training report for an ATCO. Includes operational environment metrics and time logging.
                        </p>
                        
                        <div className="flex items-center text-blue-400 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 gap-2 transition-all">
                            Create Form <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>

                {/* Placeholder for future forms */}
                <div className="bg-zinc-950/40 border border-dashed border-white/10 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-50">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 text-zinc-500 flex items-center justify-center mb-6">
                        <Plus className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">More Forms Coming</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest">
                        Future templates will appear here
                    </p>
                </div>
            </div>
            
            {/* Recent Forms Draft Section (optional expansion later) */}
            <div className="mt-16 pt-10 border-t border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Recent Activity</h3>
                <div className="flex flex-col items-center justify-center p-12 border border-white/5 rounded-3xl bg-zinc-900/20">
                    <FileText className="w-10 h-10 text-zinc-700 mb-4" />
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center">
                        No recent forms saved directly to the database.
                    </p>
                </div>
            </div>
        </div>
    )
}

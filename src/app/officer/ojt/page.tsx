import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'

export default function OjtPage() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white leading-none">OJT ASSESSMENTS</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">On-The-Job Training Forms & Records</p>
                </div>
                <Link 
                    href="/officer/ojt/new"
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-blue-900/20"
                >
                    <Plus className="w-4 h-4" />
                    New Assessment
                </Link>
            </header>

            <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <FileText className="w-16 h-16 text-zinc-700 mb-6" />
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Assessments Yet</h3>
                <p className="text-zinc-500 text-sm text-center max-w-md">
                    Create a new On-The-Job Training assessment to start documenting ATCO progress.
                </p>
            </div>
        </div>
    )
}

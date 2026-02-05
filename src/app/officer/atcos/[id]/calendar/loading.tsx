import { ArrowLeft } from 'lucide-react'

export default function Loading() {
    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 space-y-8 animate-pulse">
            <header className="flex items-center gap-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-800">
                    <ArrowLeft className="w-5 h-5 opacity-20" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white/20 uppercase tracking-tight leading-none">Personnel Schedule</h2>
                    <div className="h-4 w-48 bg-zinc-800/50 rounded-md mt-2" />
                </div>
            </header>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[600px]">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
                    <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
                    <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
                </div>
                <div className="grid grid-cols-7 gap-4">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="aspect-square bg-zinc-950/50 border border-zinc-800/50 rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}

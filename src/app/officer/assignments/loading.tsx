import { Users, UserPlus } from 'lucide-react'

export default function Loading() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 animate-pulse">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white/20 leading-none">MANAGE ATCOs</h2>
                    <div className="h-4 w-64 bg-zinc-800/50 rounded-md mt-4" />
                </div>
                <div className="w-48 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl" />
            </header>

            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 flex-shrink-0" />
                            <div className="space-y-2 flex-1 md:w-48">
                                <div className="h-5 w-32 bg-zinc-800 rounded-lg" />
                                <div className="h-3 w-48 bg-zinc-900 rounded-md" />
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="h-12 flex-1 md:w-32 bg-zinc-950 border border-zinc-800 rounded-xl" />
                            <div className="h-12 flex-1 md:w-32 bg-zinc-950 border border-zinc-800 rounded-xl" />
                            <div className="h-12 flex-1 md:w-40 bg-zinc-800 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

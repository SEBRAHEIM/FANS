export default function Loading() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 animate-pulse">
            <header className="mb-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="h-10 bg-zinc-900 rounded-xl w-64" />
                    <div className="h-12 w-32 bg-zinc-900 rounded-2xl" />
                </div>
                <div className="h-4 bg-zinc-900 rounded-lg w-48" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 h-[500px]" />
                </div>
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 h-64" />
                    <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 h-48" />
                </div>
            </div>
        </div>
    )
}

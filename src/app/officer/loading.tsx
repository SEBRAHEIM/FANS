export default function Loading() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 animate-pulse">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-4 w-full max-w-md">
                    <div className="h-8 lg:h-10 bg-zinc-900 rounded-xl w-3/4" />
                    <div className="h-4 bg-zinc-900 rounded-lg w-1/2" />
                </div>
                <div className="h-12 w-full sm:w-40 bg-zinc-900 rounded-2xl" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-zinc-900 border border-zinc-800/50 rounded-[2rem] sm:rounded-[2.5rem]" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                <div className="h-[400px] bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem]" />
                <div className="h-[400px] bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem]" />
            </div>
        </div>
    )
}

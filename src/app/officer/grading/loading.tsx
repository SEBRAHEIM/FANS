export default function Loading() {
    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 animate-pulse">
            <header className="mb-10 space-y-4">
                <div className="h-10 bg-zinc-900 rounded-xl w-64" />
                <div className="h-4 bg-zinc-900 rounded-lg w-48" />
            </header>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 bg-zinc-900 border border-zinc-800/50 rounded-2xl w-full" />
                ))}
            </div>
        </div>
    )
}

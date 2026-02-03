export default function Loading() {
    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 animate-pulse">
            <div className="max-w-3xl mx-auto w-full mb-16">
                <div className="h-20 bg-zinc-900 rounded-[2rem] w-full" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
                <div className="space-y-4 w-full">
                    <div className="h-10 bg-zinc-900 rounded-xl w-64" />
                    <div className="h-4 bg-zinc-900 rounded-lg w-48" />
                </div>
                <div className="h-12 w-full sm:w-48 bg-zinc-900 rounded-2xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem]" />
                ))}
            </div>
        </div>
    )
}

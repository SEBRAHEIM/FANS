'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Clock, CheckCircle2 } from 'lucide-react'
import { getMyExamResults } from '@/app/atco/results-actions'
import ExamResultCard from '@/components/ExamResultCard'

export default function ResultsPage() {
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchResults()
    }, [])

    async function fetchResults() {
        setLoading(true)
        const res = await getMyExamResults()
        if (res.success && res.data) {
            setResults(res.data)
        }
        setLoading(false)
    }

    const filtered = results.filter(r =>
        r.module?.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.module?.course?.title?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="p-12 flex items-center justify-center min-h-[60vh]">
                <div className="text-zinc-500 font-black uppercase tracking-widest text-[11px] animate-pulse">Retrieving Certified Records...</div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 pt-24 lg:pt-10 space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">MY CERTIFICATIONS</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Official Personnel Training & Compliance History</p>
                </div>
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="FILTER REGISTRY..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all shadow-inner"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {filtered.map((result) => (
                    <ExamResultCard
                        key={result.id}
                        result={result}
                        onViewDetails={() => { }} // Disabled for now, using PDF as main export
                    />
                ))}

                {filtered.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-center glass rounded-[4rem]">
                        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center text-zinc-700 mb-8 border border-white/5">
                            <FileText className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Registry Nominal</h3>
                        <p className="text-zinc-500 max-w-sm font-bold text-[10px] uppercase tracking-widest leading-loose">No certified records match your current filter parameters or no results have been generated yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { FileText, ChevronDown, Calendar } from 'lucide-react'
import { getMyExamResults, getExamResultDetails } from '@/app/atco/results-actions'
import ExamResultCard from '@/components/ExamResultCard'
import ExamResultDetails from '@/components/ExamResultDetails'

export default function TestResultsPage() {
    const [results, setResults] = useState<any[]>([])
    const [filteredResults, setFilteredResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, data: any | null }>({ isOpen: false, data: null })
    const [newResultId, setNewResultId] = useState<string | null>(null)

    useEffect(() => {
        fetchResults()
        // Check if redirected from quiz completion
        const urlParams = new URLSearchParams(window.location.search)
        const newId = urlParams.get('new')
        if (newId) {
            setNewResultId(newId)
            // Clear URL parameter
            window.history.replaceState({}, '', '/atco/results')
        }
    }, [])

    useEffect(() => {
        filterResults()
    }, [results, selectedYear, selectedMonth])

    async function fetchResults() {
        setLoading(true)
        const result = await getMyExamResults()
        if (result.success && result.data) {
            setResults(result.data)
        }
        setLoading(false)
    }

    function filterResults() {
        let filtered = results.filter(result => {
            const resultDate = new Date(result.completed_at)
            const yearMatch = resultDate.getFullYear() === selectedYear
            const monthMatch = selectedMonth === null || resultDate.getMonth() === selectedMonth
            return yearMatch && monthMatch
        })
        setFilteredResults(filtered)
    }

    async function handleViewDetails(resultId: string) {
        const result = await getExamResultDetails(resultId)
        if (result.success && result.data) {
            setDetailsModal({ isOpen: true, data: result.data })
        }
    }

    function handleCloseDetails() {
        setDetailsModal({ isOpen: false, data: null })
    }

    // Get available years from results
    const availableYears = Array.from(new Set(results.map(r => new Date(r.completed_at).getFullYear()))).sort((a, b) => b - a)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    if (loading) {
        return (
            <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 flex items-center justify-center">
                <div className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading results...</div>
            </div>
        )
    }

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10">
            {/* Header */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-tight">Test Results</h2>
                </div>
                <p className="text-zinc-500 font-medium text-[13px] lg:text-base tracking-tight">View all your exam results and export as PDF</p>
            </header>

            {/* Filters */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                {/* Year Filter */}
                <div className="relative">
                    <label className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-2 block">Year</label>
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 pr-10 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]"
                        >
                            {availableYears.length > 0 ? (
                                availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))
                            ) : (
                                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                            )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Month Filter */}
                <div className="relative">
                    <label className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-2 block">Month</label>
                    <div className="relative">
                        <select
                            value={selectedMonth === null ? 'all' : selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
                            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 pr-10 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]"
                        >
                            <option value="all">All Months</option>
                            {months.map((month, index) => (
                                <option key={index} value={index}>{month}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                        <span className="text-zinc-500 text-sm font-bold">
                            {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Results List */}
            {filteredResults.length > 0 ? (
                <div className="space-y-4">
                    {filteredResults.map(result => (
                        <ExamResultCard
                            key={result.id}
                            result={result}
                            onViewDetails={() => handleViewDetails(result.id)}
                            isNew={result.id === newResultId}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                    <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">No Results Found</h3>
                    <p className="text-zinc-500">
                        {selectedMonth !== null
                            ? `No exam results for ${months[selectedMonth]} ${selectedYear}`
                            : `No exam results for ${selectedYear}`
                        }
                    </p>
                </div>
            )}

            {/* Details Modal */}
            {detailsModal.isOpen && detailsModal.data && (
                <ExamResultDetails
                    isOpen={detailsModal.isOpen}
                    onClose={handleCloseDetails}
                    progress={detailsModal.data.progress}
                    responses={detailsModal.data.responses}
                />
            )}
        </div>
    )
}

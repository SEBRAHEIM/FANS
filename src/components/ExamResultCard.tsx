'use client'

import { Download, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useState } from 'react'
import { generateExamPDF } from '@/lib/pdf-generator'

interface ExamResult {
    id: string
    module_id: string
    score_percentage: number
    completed_at: string
    module: {
        id: string
        title: string
        course: {
            id: string
            title: string
        }
    }
}

interface ExamResultCardProps {
    result: ExamResult
    onViewDetails: () => void
    isNew?: boolean
}

export default function ExamResultCard({ result, onViewDetails, isNew = false }: ExamResultCardProps) {
    const [exporting, setExporting] = useState(false)

    const score = result.score_percentage || 0
    const passed = score >= 70 // Assuming 70% is passing
    const date = new Date(result.completed_at)

    function getScoreColor(score: number) {
        if (score >= 90) return 'text-green-500'
        if (score >= 70) return 'text-blue-500'
        if (score >= 50) return 'text-yellow-500'
        return 'text-red-500'
    }

    function getScoreBgColor(score: number) {
        if (score >= 90) return 'bg-green-500/20 border-green-500/30'
        if (score >= 70) return 'bg-blue-500/20 border-blue-500/30'
        if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30'
        return 'bg-red-500/20 border-red-500/30'
    }

    async function handleExportPDF() {
        setExporting(true)
        try {
            await generateExamPDF(result.id)
        } catch (error) {
            console.error('PDF Export Error:', error)
            alert('Failed to export PDF')
        }
        setExporting(false)
    }

    return (
        <div className={`bg-zinc-900 border rounded-3xl p-6 transition-all ${isNew ? 'border-blue-500 shadow-lg shadow-blue-500/20 animate-in fade-in slide-in-from-top-4' : 'border-zinc-800 hover:border-zinc-700'
            }`}>
            {isNew && (
                <div className="mb-4">
                    <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Just Completed
                    </span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Left: Course Info */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-xs text-zinc-600 font-bold">
                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <h3 className="text-lg font-black text-white">{result.module.title}</h3>
                    <p className="text-sm text-zinc-500 font-medium">{result.module.course.title}</p>
                </div>

                {/* Center: Score */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className={`text-4xl font-black ${getScoreColor(score)}`}>
                            {score}%
                        </div>
                        <div className="mt-2 w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${score >= 90 ? 'bg-green-500' :
                                        score >= 70 ? 'bg-blue-500' :
                                            score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>

                    {/* Pass/Fail Badge */}
                    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${passed ? 'bg-green-500/20 border-green-500/30 text-green-500' : 'bg-red-500/20 border-red-500/30 text-red-500'
                        }`}>
                        {passed ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-black uppercase">Passed</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-black uppercase">Failed</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onViewDetails}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {exporting ? (
                            <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

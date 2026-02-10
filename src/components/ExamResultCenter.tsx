'use client'

import { useState } from 'react'
import { FileText, Download, CheckCircle2, Clock, User, Search, ShieldCheck, HelpCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface Result {
    id: string
    student_name: string
    course_title: string
    completed_at: string
    score_percentage?: number
    module_id: string
    course_id: string
    pending_count?: number
}

export default function ExamResultCenter({ initialResults }: { initialResults: Result[] }) {
    const [results] = useState<Result[]>(initialResults)
    const [search, setSearch] = useState('')

    const filteredResults = results.filter(r =>
        r.student_name.toLowerCase().includes(search.toLowerCase()) ||
        r.course_title.toLowerCase().includes(search.toLowerCase())
    )

    const downloadPDF = (result: Result) => {
        const doc = new jsPDF() as any

        // Header
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, 210, 40, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('FANS OFFICIAL EXAM REPORT', 105, 25, { align: 'center' })

        // Content
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')

        const date = new Date(result.completed_at).toLocaleDateString()
        const time = new Date(result.completed_at).toLocaleTimeString()

        doc.text('OFFICIAL CERTIFICATION RECORD', 20, 60)
        doc.line(20, 62, 190, 62)

        const items = [
            ['Examinee Name:', result.student_name],
            ['Course / Exam:', result.course_title],
            ['Completion Date:', date],
            ['Submission Time:', time],
            ['Final Result:', result.score_percentage ? `${result.score_percentage}%` : 'COMPLETED (Non-Graded)'],
            ['Status:', 'VERIFIED BY FANS PORTAL']
        ]

        doc.autoTable({
            startY: 70,
            body: items,
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
        })

        // Digital Signature area
        const finalY = (doc as any).lastAutoTable.finalY + 30
        doc.setFontSize(10)
        doc.text('_________________________________', 20, finalY)
        doc.text('Training Officer Signature', 20, finalY + 7)

        doc.text('_________________________________', 120, finalY)
        doc.text('System Digital Stamp', 120, finalY + 7)

        // Footer
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Generated on ${new Date().toLocaleString()} | FANS-CHI-SYSTEM-REF-${result.id.slice(0, 8).toUpperCase()}`, 105, 285, { align: 'center' })

        doc.save(`EXAM_${result.student_name.replace(' ', '_')}_${result.course_title.replace(' ', '_')}.pdf`)
    }

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">COMMAND RESULTS</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Knowledge Validation & Operational Compliance</p>
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
                {filteredResults.map((result) => (
                    <div key={result.id} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] flex flex-col xl:flex-row items-center justify-between gap-10 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-8 flex-1 w-full">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xl">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Incumbent</p>
                                    <p className="text-lg font-black text-white uppercase tracking-tight">{result.student_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Evaluation Track</p>
                                    <p className="text-sm font-bold text-zinc-300">{result.course_title}</p>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Certification Date</p>
                                    <p className="text-sm font-bold text-zinc-500">{new Date(result.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Operational Status</p>
                                    {result.pending_count ? (
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-[9px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/20">
                                            <Clock className="w-3 h-3" />
                                            Awaiting Evaluation
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Certified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full xl:w-auto">
                            {result.pending_count ? (
                                <button
                                    onClick={() => window.location.href = '/officer/grading'}
                                    className="flex-1 xl:flex-none bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-amber-600/20"
                                >
                                    Grade {result.pending_count} Response{result.pending_count > 1 ? 's' : ''}
                                </button>
                            ) : (
                                <button
                                    onClick={() => downloadPDF(result)}
                                    className="flex-1 xl:flex-none bg-white text-zinc-950 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 hover:bg-blue-500 hover:text-white"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Record
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {filteredResults.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-center opacity-50">
                        <FileText className="w-16 h-16 mb-6" />
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">Registry Nominal</h4>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-2">No results matched current filter parameters</p>
                    </div>
                )}
            </div>
        </div>
    )
}

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
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-white">EXAM COMMAND CENTER</h2>
                    <p className="text-zinc-500 font-medium">Verify student completions, review responses, and export official reports.</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Examinee or Course..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {filteredResults.map((result) => (
                    <div key={result.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-zinc-700 transition-all group">
                        <div className="flex items-center gap-6 flex-1">
                            <div className="w-16 h-16 rounded-[2rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xl shadow-emerald-500/5">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-12 flex-1">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Examinee</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-zinc-700" />
                                        <p className="text-sm font-bold text-white">{result.student_name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Exam Track</p>
                                    <p className="text-sm font-bold text-zinc-300 line-clamp-1">{result.course_title}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Submitted On</p>
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <Clock className="w-3 h-3" />
                                        <p className="text-xs font-bold">{new Date(result.completed_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</p>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => downloadPDF(result)}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                    </div>
                ))}

                {filteredResults.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                        <FileText className="w-12 h-12 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">No results found for your query</p>
                    </div>
                )}
            </div>
        </div>
    )
}

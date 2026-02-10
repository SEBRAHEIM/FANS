import jsPDF from 'jspdf'
import { createClient } from '@/lib/supabase/client'

export async function generateExamPDF(resultId: string) {
    const supabase = createClient()

    try {
        // 1. Fetch result with joins
        const { data: result, error } = await supabase
            .from('results')
            .select(`
                *,
                atco:profiles!atco_id(full_name, email),
                course:courses(title),
                assessment:assessments(title)
            `)
            .eq('id', resultId)
            .single()

        if (error || !result) throw new Error('Failed to fetch result details')

        // 2. Create PDF
        const doc = new jsPDF() as any
        const pageWidth = doc.internal.pageSize.getWidth()

        // Header
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('FANS OFFICIAL CERTIFICATION', 105, 25, { align: 'center' })

        // Body
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')

        const date = new Date(result.created_at).toLocaleDateString()
        const time = new Date(result.created_at).toLocaleTimeString()

        doc.text('OFFICIAL TRAINING RECORD', 20, 60)
        doc.line(20, 62, 190, 62)

        const items = [
            ['Examinee Name:', result.atco?.full_name],
            ['Personnel ID:', result.atco_id.slice(0, 8).toUpperCase()],
            ['Training Track:', result.course?.title || result.assessment?.title],
            ['Completion Date:', date],
            ['Completion Time:', time],
            ['Final Score:', `${result.score}%`],
            ['Status:', result.pass ? 'CERTIFIED' : 'NOT QUALIFIED']
        ]

        doc.autoTable({
            startY: 70,
            body: items,
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 8 },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        })

        // Digital Stamp
        const finalY = (doc as any).lastAutoTable.finalY + 40
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('_________________________________', 120, finalY)
        doc.text('Aviation Authority Digital Stamp', 120, finalY + 7)
        doc.text(`REF-ID: ${result.id.toUpperCase()}`, 120, finalY + 12)

        doc.save(`CERTIFICATION_${result.atco?.full_name?.replace(' ', '_')}_${result.id.slice(0, 5)}.pdf`)

        return { success: true }
    } catch (err: any) {
        console.error('PDF Generation Error:', err)
        throw err
    }
}

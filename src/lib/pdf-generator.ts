import jsPDF from 'jspdf'
import { getExamResultDetails, getAtcoProfile } from '@/app/atco/results-actions'

export async function generateExamPDF(progressId: string) {
    try {
        // Fetch exam details and profile
        const [detailsResult, profileResult] = await Promise.all([
            getExamResultDetails(progressId),
            getAtcoProfile()
        ])

        if (detailsResult.error || !detailsResult.data) {
            throw new Error('Failed to fetch exam details')
        }

        if (profileResult.error || !profileResult.data) {
            throw new Error('Failed to fetch profile')
        }

        const { progress, responses } = detailsResult.data
        const profile = profileResult.data

        // Create PDF
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        let yPos = 20

        // Header - FANS Portal
        doc.setFillColor(24, 24, 27) // zinc-900
        doc.rect(0, 0, pageWidth, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('FANS PORTAL', pageWidth / 2, 20, { align: 'center' })
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('Exam Results Certificate', pageWidth / 2, 30, { align: 'center' })

        yPos = 60

        // ATCO Information
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('ATCO Information', 20, yPos)
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.text(`Name: ${profile.full_name}`, 20, yPos)
        yPos += 6
        doc.text(`Email: ${profile.email}`, 20, yPos)
        yPos += 6
        doc.text(`Date: ${new Date(progress.completed_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 20, yPos)
        yPos += 15

        // Course Information
        doc.setFont('helvetica', 'bold')
        doc.text('Course Information', 20, yPos)
        yPos += 8
        doc.setFont('helvetica', 'normal')
        const courseTitle = (progress.module as any).course?.title || 'Unknown Course'
        const moduleTitle = (progress.module as any).title || 'Unknown Module'
        doc.text(`Course: ${courseTitle}`, 20, yPos)
        yPos += 6
        doc.text(`Module: ${moduleTitle}`, 20, yPos)
        yPos += 15

        // Score Section
        const score = progress.score_percentage || 0
        const passed = score >= 70

        // Score box
        doc.setFillColor(passed ? 34, 197, 94 : 239, 68, 68) // green-500 or red-500
        doc.roundedRect(20, yPos, 60, 30, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(28)
        doc.setFont('helvetica', 'bold')
        doc.text(`${score}%`, 50, yPos + 20, { align: 'center' })

        // Status box
        doc.setFillColor(passed ? 220 : 254, passed ? 252 : 226, passed ? 231 : 226) // green-100 or red-100
        doc.roundedRect(90, yPos, 60, 30, 3, 3, 'F')
        if (passed) {
            doc.setTextColor(34, 197, 94)
        } else {
            doc.setTextColor(239, 68, 68)
        }
        doc.setFontSize(16)
        doc.text(passed ? 'PASSED' : 'FAILED', 120, yPos + 20, { align: 'center' })

        yPos += 45

        // Questions and Answers
        if (responses && responses.length > 0) {
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Exam Questions & Answers', 20, yPos)
            yPos += 10

            responses.forEach((response: any, index: number) => {
                // Check if we need a new page
                if (yPos > pageHeight - 60) {
                    doc.addPage()
                    yPos = 20
                }

                const question = response.question
                const isCorrect = response.is_correct

                // Question number and text
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text(`${index + 1}. ${question.question_text}`, 20, yPos, { maxWidth: pageWidth - 40 })
                yPos += 8

                // User's answer
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(100, 100, 100)
                doc.text(`Your Answer: ${response.answer_text}`, 30, yPos, { maxWidth: pageWidth - 50 })
                yPos += 6

                // Correct answer (if wrong)
                if (!isCorrect && question.correct_answer) {
                    doc.text(`Correct Answer: ${question.correct_answer}`, 30, yPos, { maxWidth: pageWidth - 50 })
                    yPos += 6
                }

                // Correct/Incorrect indicator
                doc.setFont('helvetica', 'bold')
                if (isCorrect) {
                    doc.setTextColor(34, 197, 94) // green
                    doc.text('✓ Correct', 30, yPos)
                } else {
                    doc.setTextColor(239, 68, 68) // red
                    doc.text('✗ Incorrect', 30, yPos)
                }
                doc.setTextColor(0, 0, 0)
                yPos += 12
            })
        }

        // Footer
        const footerY = pageHeight - 20
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('Generated by FANS Portal - Air Traffic Control Training System', pageWidth / 2, footerY, { align: 'center' })
        doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}`, pageWidth / 2, footerY + 5, { align: 'center' })

        // Save PDF
        const fileName = `exam-result-${new Date(progress.completed_at).toISOString().split('T')[0]}.pdf`
        doc.save(fileName)

        return { success: true }
    } catch (error: any) {
        console.error('PDF Generation Error:', error)
        throw error
    }
}

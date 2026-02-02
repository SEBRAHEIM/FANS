'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Checks if all responses for a module are graded and updates the progress.
 */
export async function finalizeModuleGrading(studentId: string, moduleId: string) {
    try {
        const supabase = await createClient()

        // 1. Fetch all responses for this student and module
        const { data: questions } = await supabase
            .from('quiz_questions')
            .select('id')
            .eq('module_id', moduleId)

        const questionIds = questions?.map(q => q.id) || []

        const { data: responses } = await supabase
            .from('student_responses')
            .select('is_correct')
            .eq('user_id', studentId)
            .in('question_id', questionIds)

        // 2. Check if any are still ungraded (is_correct is null)
        const hasUngraded = responses?.some(r => r.is_correct === null)

        if (hasUngraded) {
            return { success: true, finalized: false }
        }

        // 3. Calculate total score
        const correctCount = responses?.filter(r => r.is_correct === true).length || 0
        const totalCount = responses?.length || 0
        const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

        // 4. Update student_progress
        const { error } = await supabase
            .from('student_progress')
            .update({
                is_completed: true,
                score_percentage: scorePercentage,
                completed_at: new Date().toISOString()
            })
            .match({ user_id: studentId, module_id: moduleId })

        if (error) throw error

        revalidatePath('/officer/grading')
        revalidatePath('/atco/results')

        return { success: true, finalized: true, score: scorePercentage }
    } catch (error: any) {
        console.error('Finalize Grading Error:', error)
        return { error: error.message }
    }
}

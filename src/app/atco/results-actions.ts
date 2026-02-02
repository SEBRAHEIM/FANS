'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get all exam results for the current ATCO
 */
export async function getMyExamResults() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // Fetch all completed quiz modules with scores
        const { data, error } = await supabase
            .from('student_progress')
            .select(`
                id,
                module_id,
                score_percentage,
                is_completed,
                completed_at,
            module:course_modules(
                    id,
                    title,
                    description,
                    module_type,
                    course:courses(
                        id,
                        title
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .order('completed_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Get Exam Results Error:', error)
        return { error: error.message || 'Failed to fetch exam results' }
    }
}

/**
 * Get detailed exam result with questions and answers
 */
export async function getExamResultDetails(progressId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // Fetch progress record
        const { data: progress, error: progressError } = await supabase
            .from('student_progress')
            .select(`
                id,
                module_id,
                score_percentage,
                completed_at,
                module:course_modules(
                    id,
                    title,
                    description,
                    course:courses(
                        id,
                        title
                    )
                )
            `)
            .eq('id', progressId)
            .eq('user_id', user.id)
            .single()

        if (progressError) throw progressError

        // Fetch all questions for this module to get their IDs
        const { data: moduleQuestions } = await supabase
            .from('quiz_questions')
            .select('id')
            .eq('module_id', progress.module_id)

        const questionIds = moduleQuestions?.map(q => q.id) || []

        // Fetch all responses for these questions
        const { data: responses, error: responsesError } = await supabase
            .from('student_responses')
            .select(`
                id,
                question_id,
                answer_text,
                is_correct,
                question:quiz_questions(
                    id,
                    question_text,
                    question_type,
                    options,
                    correct_answer
                )
            `)
            .eq('user_id', user.id)
            .in('question_id', questionIds)

        if (responsesError) throw responsesError

        return {
            success: true,
            data: {
                progress,
                responses
            }
        }
    } catch (error: any) {
        console.error('Get Exam Details Error:', error)
        return { error: error.message || 'Failed to fetch exam details' }
    }
}

/**
 * Get ATCO profile for PDF generation
 */
export async function getAtcoProfile() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', user.id)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Get Profile Error:', error)
        return { error: error.message || 'Failed to fetch profile' }
    }
}

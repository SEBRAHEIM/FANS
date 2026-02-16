'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get all results for the current ATCO
 */
export async function getMyExamResults() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // Fetch from verified results table
        const { data, error } = await supabase
            .from('results')
            .select(`
                *,
                course:courses(title),
                assessment:assessments(title)
            `)
            .eq('atco_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Map to format expected by UI
        const mappedData = data.map(r => ({
            id: r.id,
            completed_at: r.created_at,
            score_percentage: r.score,
            pass: r.pass,
            module: {
                title: r.course?.title || r.assessment?.title,
                course: {
                    title: r.course?.title || 'Standalone'
                }
            }
        }))

        return { success: true, data: mappedData }
    } catch (error: any) {
        console.error('Get Results Error:', error)
        return { error: error.message || 'Failed to fetch results' }
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
                module:modules(
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

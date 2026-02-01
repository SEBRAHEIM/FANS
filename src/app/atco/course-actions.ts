'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get all assignments for the current ATCO
 */
export async function getMyAssignments() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const { data, error } = await supabase
            .from('course_assignments')
            .select(`
                *,
                course:courses(
                    id,
                    title,
                    description,
                    course_modules(id, title, order_index)
                ),
                assigned_by_profile:profiles!course_assignments_assigned_by_fkey(full_name)
            `)
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Get My Assignments Error:', error)
        return { error: error.message || 'Failed to fetch assignments' }
    }
}

/**
 * Start an assignment (marks as in_progress and sets started_at)
 */
export async function startAssignment(assignmentId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // Verify this assignment belongs to the current user
        const { data: assignment } = await supabase
            .from('course_assignments')
            .select('*')
            .eq('id', assignmentId)
            .eq('assigned_to', user.id)
            .single()

        if (!assignment) {
            return { error: 'Assignment not found or unauthorized' }
        }

        if (assignment.status !== 'pending') {
            return { error: 'Assignment already started or completed' }
        }

        // Update assignment to in_progress
        const { data, error } = await supabase
            .from('course_assignments')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString(),
                time_remaining_seconds: assignment.time_limit_minutes ? assignment.time_limit_minutes * 60 : null
            })
            .eq('id', assignmentId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/atco/trainings')

        return { success: true, data }
    } catch (error: any) {
        console.error('Start Assignment Error:', error)
        return { error: error.message || 'Failed to start assignment' }
    }
}

/**
 * Update time remaining for an assignment
 */
export async function updateTimeRemaining(assignmentId: string, secondsRemaining: number) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('course_assignments')
            .update({ time_remaining_seconds: secondsRemaining })
            .eq('id', assignmentId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Update Time Remaining Error:', error)
        return { error: error.message || 'Failed to update time' }
    }
}

/**
 * Complete an assignment
 */
export async function completeAssignment(assignmentId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const { data, error } = await supabase
            .from('course_assignments')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', assignmentId)
            .eq('assigned_to', user.id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/atco/trainings')

        return { success: true, data }
    } catch (error: any) {
        console.error('Complete Assignment Error:', error)
        return { error: error.message || 'Failed to complete assignment' }
    }
}

/**
 * Mark assignment as expired (when time runs out)
 */
export async function expireAssignment(assignmentId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('course_assignments')
            .update({ status: 'expired' })
            .eq('id', assignmentId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/atco/trainings')

        return { success: true, data }
    } catch (error: any) {
        console.error('Expire Assignment Error:', error)
        return { error: error.message || 'Failed to expire assignment' }
    }
}

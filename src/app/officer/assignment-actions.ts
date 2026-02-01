'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Assign a course to multiple ATCOs with deadline and time limit
 */
export async function assignCourse(
    courseId: string,
    atcoIds: string[],
    deadline: string | null,
    timeLimitMinutes: number | null
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        // Verify user is a training officer
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['training_officer', 'admin', 'head_of_training'].includes(profile.role)) {
            return { error: 'Unauthorized: Only training officers can assign courses' }
        }

        // Create assignments for each ATCO
        const assignments = atcoIds.map(atcoId => ({
            course_id: courseId,
            assigned_to: atcoId,
            assigned_by: user.id,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            time_limit_minutes: timeLimitMinutes,
            status: 'pending'
        }))

        const { data, error } = await supabase
            .from('course_assignments')
            .insert(assignments)
            .select()

        if (error) throw error

        revalidatePath('/officer/content')
        revalidatePath('/atco/trainings')

        return { success: true, data }
    } catch (error: any) {
        console.error('Assign Course Error:', error)
        return { error: error.message || 'Failed to assign course' }
    }
}

/**
 * Get all assignments for a specific course
 */
export async function getCourseAssignments(courseId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('course_assignments')
            .select(`
                *,
                assigned_to_profile:profiles!course_assignments_assigned_to_fkey(id, full_name, email),
                assigned_by_profile:profiles!course_assignments_assigned_by_fkey(id, full_name),
                course:courses(id, title)
            `)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Get Course Assignments Error:', error)
        return { error: error.message || 'Failed to fetch assignments' }
    }
}

/**
 * Delete an assignment (Training Officer only)
 */
export async function deleteAssignment(assignmentId: string) {
    try {
        const admin = createAdminClient()

        const { error } = await admin
            .from('course_assignments')
            .delete()
            .eq('id', assignmentId)

        if (error) throw error

        revalidatePath('/officer/content')
        revalidatePath('/atco/trainings')

        return { success: true }
    } catch (error: any) {
        console.error('Delete Assignment Error:', error)
        return { error: error.message || 'Failed to delete assignment' }
    }
}

/**
 * Get assignment statistics for a course
 */
export async function getCourseAssignmentStats(courseId: string) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('course_assignments')
            .select('status')
            .eq('course_id', courseId)

        if (error) throw error

        const stats = {
            total: data.length,
            pending: data.filter(a => a.status === 'pending').length,
            in_progress: data.filter(a => a.status === 'in_progress').length,
            completed: data.filter(a => a.status === 'completed').length,
            overdue: data.filter(a => a.status === 'overdue').length,
            expired: data.filter(a => a.status === 'expired').length,
        }

        return { success: true, data: stats }
    } catch (error: any) {
        console.error('Get Assignment Stats Error:', error)
        return { error: error.message || 'Failed to fetch stats' }
    }
}

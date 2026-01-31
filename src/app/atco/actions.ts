'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates the current progress of a student within a module.
 * Stores the specific timestamp for resumption.
 */
export async function updateModuleProgress(moduleId: string, timestampSeconds: number, isCompleted: boolean = false) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { error } = await supabase
            .from('student_progress')
            .upsert({
                user_id: user.id,
                module_id: moduleId,
                current_timestamp: timestampSeconds,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null
            }, {
                onConflict: 'user_id,module_id'
            })

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error('Update Progress Error:', error)
        return { error: error.message }
    }
}

/**
 * Marks a specific checkpoint (interactive MCQ) as cleared.
 */
export async function clearCheckpoint(moduleId: string, checkpointId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // Fetch current list of cleared checkpoints
        const { data: progress } = await supabase
            .from('student_progress')
            .select('completed_checkpoints')
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .single()

        const cleared = progress?.completed_checkpoints || []
        if (!cleared.includes(checkpointId)) {
            const { error } = await supabase
                .from('student_progress')
                .update({
                    completed_checkpoints: [...cleared, checkpointId]
                })
                .eq('user_id', user.id)
                .eq('module_id', moduleId)

            if (error) throw error
        }

        return { success: true }
    } catch (error: any) {
        console.error('Clear Checkpoint Error:', error)
        return { error: error.message }
    }
}

/**
 * Logs attendance for a live online class.
 */
export async function logAttendance(moduleId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { error } = await supabase
            .from('live_attendance')
            .upsert({
                module_id: moduleId,
                user_id: user.id,
                attended_at: new Date().toISOString()
            }, {
                onConflict: 'module_id,user_id'
            })

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error('Log Attendance Error:', error)
        return { error: error.message }
    }
}

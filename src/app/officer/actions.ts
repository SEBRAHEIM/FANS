'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggles the OJTI status of a profile.
 * Uses the Admin client as a failsafe to bypass RLS issues for administrative actions.
 */
export async function toggleOjtiStatus(profileId: string, currentStatus: boolean) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const admin = createAdminClient()

        const { error } = await admin
            .from('profiles')
            .update({ is_ojti: !currentStatus })
            .eq('id', profileId)

        if (error) throw error

        revalidatePath('/officer/assignments')
        return { success: true }
    } catch (error: any) {
        console.error('Toggle OJTI Error:', error)
        return { error: error.message || 'Failed to update OJTI status' }
    }
}

/**
 * Robustly deletes a course and all its modules using the Admin client.
 * This bypasses RLS issues that often block client-side deletions for Training Officers.
 * Includes brute-force cleanup of all possible module table names.
 */
export async function deleteCourseAction(courseId: string) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] STRICT DELETE INITIATED:`, courseId)

    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const admin = createAdminClient()

        // 1. Delete modules from all potential table names (Brute Force)
        console.log(`[${timestamp}] Deleting modules for course ${courseId}...`)

        const deleteResults = await Promise.all([
            admin.from('modules').delete().eq('course_id', courseId),
            admin.from('online_modules').delete().eq('course_id', courseId)
        ])

        const moduleErrors = deleteResults.map(r => r.error).filter(Boolean)
        if (moduleErrors.length > 0) {
            console.warn(`[${timestamp}] Module deletion encountered partial issues:`, moduleErrors)
            // We continue anyway to try and delete the main course record
        }

        // 2. Delete the course (Cascade should handle the rest if FKs are set)
        console.log(`[${timestamp}] Deleting main course record...`)
        const { error: courseError } = await admin
            .from('courses')
            .delete()
            .eq('id', courseId)

        if (courseError) {
            console.error(`[${timestamp}] CRITICAL COURSE DELETE ERROR:`, courseError)
            throw new Error(`Course deletion failed: ${courseError.message}`)
        }

        console.log(`[${timestamp}] SUCCESS: Course ${courseId} deleted.`)
        revalidatePath('/officer/content')
        return { success: true }
    } catch (error: any) {
        console.error(`[${timestamp}] STRICT DELETE CATCH ERROR:`, error)
        return { error: error.message || 'Fatal error during deletion' }
    }
}

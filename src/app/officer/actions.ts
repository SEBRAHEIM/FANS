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

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollInSession(formData: FormData) {
    const supabase = await createClient()
    const session_id = formData.get('session_id') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('enrollments')
        .insert([{
            session_id,
            user_id: user.id,
            status: 'enrolled'
        }])

    if (error) {
        if (error.code === '23505') return { error: 'You are already enrolled in this session.' }
        return { error: error.message }
    }

    revalidatePath('/atco/trainings')
    revalidatePath('/atco')
    return { success: true }
}

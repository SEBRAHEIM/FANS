'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// COURSES
export async function createCourse(formData: FormData) {
    const supabase = await createClient()
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    const { error } = await supabase
        .from('courses')
        .insert([{ title, description }])

    if (error) return { error: error.message }

    revalidatePath('/admin/courses')
    return { success: true }
}

// LOCATIONS
export async function createLocation(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const address = formData.get('address') as string

    const { error } = await supabase
        .from('locations')
        .insert([{ name, address }])

    if (error) return { error: error.message }

    revalidatePath('/admin/locations')
    return { success: true }
}

// SESSIONS
export async function createSession(formData: FormData) {
    const supabase = await createClient()
    const course_id = formData.get('course_id') as string
    const location_manual = formData.get('location_manual') as string
    const instructor_id = formData.get('instructor_id') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const capacity = parseInt(formData.get('capacity') as string)

    const { error } = await supabase
        .from('sessions')
        .insert([{
            course_id: null,
            course_manual: formData.get('course_manual') as string,
            location_id: null,
            location_manual,
            instructor_id,
            start_date,
            end_date,
            capacity
        }])

    if (error) return { error: error.message }

    revalidatePath('/admin/sessions')
    return { success: true }
}

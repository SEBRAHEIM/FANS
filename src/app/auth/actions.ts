'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // 1. Find the email associated with the username (case-insensitive)
    const { data: userData, error: lookupError } = await adminClient
        .from('profiles')
        .select('email, id')
        .ilike('username', username)
        .single()

    if (lookupError || !userData?.email) {
        console.error('Login Error: Username not found', username)
        return { error: 'Invalid username or password' }
    }

    // 2. Sign in using the found email
    const { error, data } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
    })

    if (error) {
        return { error: 'Invalid username or password' }
    }

    // Get user profile to redirect to correct dashboard
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

    revalidatePath('/', 'layout')

    if (profile?.role === 'head_of_training' || profile?.role === 'admin') {
        redirect('/admin')
    } else if (profile?.role === 'training_officer') {
        redirect('/officer')
    } else if (profile?.role === 'instructor') {
        redirect('/instructor')
    } else {
        redirect('/atco')
    }
}

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string
    const supabase = await createClient()

    // 1. Update the password in auth.users
    const { error: authError } = await supabase.auth.updateUser({
        password: password
    })

    if (authError) return { error: authError.message }

    // 2. Update the profile flag
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ must_change_password: false })
            .eq('id', user.id)

        if (profileError) return { error: profileError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

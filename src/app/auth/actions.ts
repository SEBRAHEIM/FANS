'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // 1. Find the profile by username OR email (case-insensitive)
    const { data: userData, error: lookupError } = await adminClient
        .from('profiles')
        .select('email, id, username')
        .or(`username.ilike.${username},email.ilike.${username}`)
        .single()

    if (lookupError || !userData?.email) {
        console.error('Login Error: Profile not found for', username, lookupError)
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

    // 3. Get user profile using ADMIN client to bypass any RLS read issues
    const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

    const cookieStore = await cookies()
    const role = profile?.role || 'atco'
    cookieStore.set('user-role', role, { maxAge: 60 * 60 * 24 * 7, path: '/' })

    revalidatePath('/', 'layout')

    if (role === 'head_of_training' || role === 'admin') {
        redirect('/admin')
    } else if (role === 'training_officer') {
        redirect('/officer')
    } else if (role === 'instructor') {
        redirect('/instructor')
    } else {
        redirect('/atco')
    }
}

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string
    const supabase = await createClient()
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // 1. Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No active session' }

    // 2. Update the password in auth.users
    const { error: authError } = await supabase.auth.updateUser({
        password: password
    })

    if (authError) return { error: authError.message }

    // 3. Update the profile flag using ADMIN client to bypass RLS/slow lookups
    const { error: profileError } = await adminClient
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id)

    if (profileError) {
        console.error('Profile Flag Error:', profileError)
        // We continue anyway as the password IS changed, 
        // and we don't want to get the user stuck on the loading screen
    }

    revalidatePath('/', 'layout')
    // Redirect to home which handles role-based routing via middleware
    // This is faster and more reliable than redirecting to /login
    redirect('/')
}

export async function logout() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    cookieStore.delete('user-role')
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

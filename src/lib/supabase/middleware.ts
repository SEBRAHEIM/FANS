import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export const updateSession = async (request: NextRequest) => {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const isLoginPage = url.pathname === '/login'
    const isResetPage = url.pathname === '/reset-password'
    const isAuthAction = url.pathname.startsWith('/auth')

    if (user) {
        // Fetch profile for additional checks
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, must_change_password')
            .eq('id', user.id)
            .single()

        // 1. Force Password Change Check
        if (profile?.must_change_password && !isResetPage && !isAuthAction) {
            url.pathname = '/reset-password'
            return NextResponse.redirect(url)
        }

        // 2. Prevent logged in users from visiting login
        if (isLoginPage && !profile?.must_change_password) {
            if (profile?.role === 'head_of_training' || profile?.role === 'admin') {
                url.pathname = '/admin'
            } else if (profile?.role === 'training_officer') {
                url.pathname = '/officer'
            } else {
                url.pathname = '/atco'
            }
            return NextResponse.redirect(url)
        }

        // 3. Enforce Correct Dashboard based on Role
        const isAtcoPath = url.pathname.startsWith('/atco')
        const isOfficerPath = url.pathname.startsWith('/officer')
        const isAdminPath = url.pathname.startsWith('/admin')

        if (profile?.role === 'training_officer' && (isAtcoPath || isAdminPath || url.pathname === '/')) {
            url.pathname = '/officer'
            return NextResponse.redirect(url)
        }

        if (profile?.role === 'atco' && (isOfficerPath || isAdminPath || url.pathname === '/')) {
            url.pathname = '/atco'
            return NextResponse.redirect(url)
        }

        if ((profile?.role === 'head_of_training' || profile?.role === 'admin') && (isAtcoPath || isOfficerPath || url.pathname === '/')) {
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    } else {
        // Not logged in
        if (!isLoginPage && !isAuthAction) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return response
}

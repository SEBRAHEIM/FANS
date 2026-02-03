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
    const isPublicAsset = url.pathname.includes('.') || url.pathname.startsWith('/_next')

    if (isPublicAsset) return response

    if (user) {
        // Only fetch profile if we are not on a dashboard or if we are on the login page
        const isDashboardPath = url.pathname.startsWith('/atco') ||
            url.pathname.startsWith('/officer') ||
            url.pathname.startsWith('/admin')

        if (isLoginPage || !isDashboardPath || url.pathname === '/') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, must_change_password')
                .eq('id', user.id)
                .single()

            if (profile?.must_change_password && !isResetPage && !isAuthAction) {
                url.pathname = '/reset-password'
                return NextResponse.redirect(url)
            }

            if (isLoginPage || url.pathname === '/') {
                if (profile?.role === 'head_of_training' || profile?.role === 'admin') {
                    url.pathname = '/admin'
                } else if (profile?.role === 'training_officer') {
                    url.pathname = '/officer'
                } else {
                    url.pathname = '/atco'
                }
                return NextResponse.redirect(url)
            }
        }
    } else {
        if (!isLoginPage && !isAuthAction) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return response
}

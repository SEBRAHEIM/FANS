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

    const url = request.nextUrl.clone()
    const isLoginPage = url.pathname === '/login'
    const isResetPage = url.pathname === '/reset-password'
    const isAuthAction = url.pathname.startsWith('/auth')
    const isPublicAsset = url.pathname.includes('.') || url.pathname.startsWith('/_next')

    if (isPublicAsset) return response

    const userRole = request.cookies.get('user-role')?.value
    const isPrefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch'

    // 1. FAST PATH: If prefetching, just render the shell. Let client handle data.
    if (isPrefetch && !isLoginPage && !isAuthAction) {
        return response
    }

    // 2. FAST PATH: Use Role Cookie for instant redirection
    if (userRole) {
        if (isLoginPage || url.pathname === '/') {
            url.pathname = userRole === 'training_officer' ? '/officer' :
                (userRole === 'head_of_training' || userRole === 'admin') ? '/admin' : '/atco'
            return NextResponse.redirect(url)
        }
    }

    // 3. SECURE PATH: Non-prefetch requests
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        if (!userRole || isLoginPage || url.pathname === '/') {
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
                const role = profile?.role || 'atco'
                url.pathname = role === 'training_officer' ? '/officer' :
                    (role === 'head_of_training' || role === 'admin') ? '/admin' : '/atco'

                const res = NextResponse.redirect(url)
                res.cookies.set('user-role', role, { maxAge: 60 * 60 * 24 * 7, path: '/' })
                return res
            }
        }
    } else {
        if (!isLoginPage && !isAuthAction) {
            url.pathname = '/login'
            const res = NextResponse.redirect(url)
            res.cookies.delete('user-role')
            return res
        }
    }

    return response
}

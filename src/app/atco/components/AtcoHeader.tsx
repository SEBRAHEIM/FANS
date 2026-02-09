import { createClient } from '@/lib/supabase/server'
import { Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import FansLogo from '@/components/FansLogo'

export default async function AtcoHeader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single()

    return (
        <header className="mb-10">
            <div className="flex items-center gap-4 mb-2">
                <FansLogo className="h-8 w-auto hidden sm:block" />
                <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-tight">HELLO, {profile?.full_name?.split(' ')[0] || 'ATCO'}</h2>
                </div>
                <Link
                    href="/atco/calendar"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">View Calendar</span>
                </Link>
            </div>
            <p className="text-zinc-500 font-medium text-sm">Welcome back to your Training Zone.</p>
        </header>
    )
}

export function AtcoHeaderSkeleton() {
    return (
        <header className="mb-10 animate-pulse">
            <div className="flex items-start justify-between gap-4 mb-2">
                <div className="h-10 bg-zinc-900 rounded-xl w-64" />
                <div className="h-12 w-32 bg-zinc-900 rounded-2xl" />
            </div>
            <div className="h-4 bg-zinc-900 rounded-lg w-48" />
        </header>
    )
}

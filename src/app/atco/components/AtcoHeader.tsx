import { createClient } from '@/lib/supabase/server'
import { Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'

export default async function AtcoHeader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single()

    return (
        <header className="mb-10 animate-fade-in shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-tight text-white drop-shadow-sm">HELLO, {profile?.full_name?.split(' ')[0] || 'ATCO'}</h1>
                <Link
                    href="/atco/calendar"
                    className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/5 group flex-shrink-0"
                >
                    <CalendarIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span className="hidden sm:inline">View Schedule</span>
                </Link>
            </div>
            <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-[0.2em] ml-1">Welcome back to your Training Command.</p>
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

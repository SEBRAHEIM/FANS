import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/CalendarView'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AtcoCalendarPage({
    params
}: {
    params: { id: string }
}) {
    const supabase = await createClient()

    // Check if user is training officer or admin
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    if (profile?.role === 'atco') {
        return notFound()
    }

    // Get the ATCO's profile
    const { data: atcoProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', params.id)
        .single()

    if (!atcoProfile) {
        return notFound()
    }

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 space-y-8">
            <header className="flex items-center gap-4">
                <Link
                    href="/officer/assignments"
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Personnel Schedule</h2>
                    <p className="text-sm text-zinc-500 mt-1">Viewing training calendar for <span className="text-white font-bold">{atcoProfile.full_name}</span></p>
                </div>
            </header>

            <CalendarView atcoId={params.id} />
        </div>
    )
}

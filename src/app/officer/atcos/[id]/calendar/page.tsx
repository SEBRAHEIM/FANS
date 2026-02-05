import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/CalendarView'
import { getCalendarAssignments } from '@/app/atco/calendar-sync-actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

async function CalendarContent({ atcoId, atcoName }: { atcoId: string, atcoName: string }) {
    const supabase = await createClient()

    // Fetch OJTIs and Assignments in parallel
    const [
        { data: ojtis },
        assignmentsResult
    ] = await Promise.all([
        supabase.from('profiles')
            .select('id, full_name, username')
            .eq('is_ojti', true),
        getCalendarAssignments(atcoId)
    ])

    return (
        <CalendarView
            atcoId={atcoId}
            atcoName={atcoName}
            ojtis={ojtis || []}
            initialAssignments={assignmentsResult.success ? assignmentsResult.data : []}
        />
    )
}

function CalendarSkeleton() {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[600px] animate-pulse">
            <div className="flex items-center justify-between mb-8">
                <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
                <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
                <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
            </div>
            <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-zinc-950/50 border border-zinc-800/50 rounded-2xl" />
                ))}
            </div>
        </div>
    )
}

export default async function AtcoCalendarPage({
    params
}: {
    params: { id: string }
}) {
    const supabase = await createClient()

    // Parallelize the shell data
    const [
        { data: { user } },
        { data: atcoProfile }
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles').select('full_name').eq('id', params.id).single()
    ])

    if (!user || !atcoProfile) return notFound()

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 space-y-8">
            <header className="flex items-center gap-4">
                <Link
                    href="/officer/assignments"
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:bg-zinc-800 transition-all hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Personnel Schedule</h2>
                    <p className="text-sm text-zinc-500 mt-2 font-medium">
                        Viewing training calendar for <span className="text-white font-bold">{atcoProfile.full_name}</span>
                    </p>
                </div>
            </header>

            <Suspense fallback={<CalendarSkeleton />}>
                <CalendarContent atcoId={params.id} atcoName={atcoProfile.full_name} />
            </Suspense>
        </div>
    )
}

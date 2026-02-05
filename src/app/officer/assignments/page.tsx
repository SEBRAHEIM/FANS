import { createClient } from '@/lib/supabase/server'
import AtcoRoster from '@/components/AtcoRoster'
import { UserPlus } from 'lucide-react'
import { Suspense } from 'react'

async function RosterContent() {
    const supabase = await createClient()
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()

    // Parallelize all data fetches
    const [
        { data: atcos },
        { data: courses },
        { data: locations },
        { data: ojtis },
        { data: allSessions }
    ] = await Promise.all([
        admin.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('courses').select('id, title').eq('is_active', true).order('title', { ascending: true }),
        supabase.from('locations').select('id, name').eq('is_active', true).order('name', { ascending: true }),
        admin.from('profiles').select('*').or('role.eq.training_officer,is_ojti.eq.true').order('full_name', { ascending: true }),
        admin.from('sessions').select(`*, course:course_id(title), location:location_id(name)`)
    ])

    return (
        <AtcoRoster
            atcos={atcos || []}
            courses={courses || []}
            locations={locations || []}
            ojtis={ojtis || []}
            sessions={allSessions || []}
        />
    )
}

function RosterSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 flex-shrink-0" />
                        <div className="space-y-2 flex-1 md:w-48">
                            <div className="h-5 w-32 bg-zinc-800 rounded-lg" />
                            <div className="h-3 w-48 bg-zinc-900 rounded-md" />
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="h-12 flex-1 md:w-32 bg-zinc-950 border border-zinc-800 rounded-xl" />
                        <div className="h-12 flex-1 md:w-32 bg-zinc-950 border border-zinc-800 rounded-xl" />
                        <div className="h-12 flex-1 md:w-40 bg-zinc-800 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default async function AssignmentsPage() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white leading-none">MANAGE ATCOs</h2>
                    <p className="text-zinc-500 font-medium text-[13px] lg:text-base tracking-tight mt-4">Promote controller qualifications and designate OJTIs.</p>
                </div>
                <button className="w-full md:w-auto bg-zinc-900 border border-zinc-800 text-white px-8 py-4 xl:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group hover:border-blue-500/50">
                    <UserPlus className="w-5 h-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                    Add New Personnel
                </button>
            </header>

            <Suspense fallback={<RosterSkeleton />}>
                <RosterContent />
            </Suspense>
        </div>
    )
}

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
        { data: allSessions },
        { data: progress }
    ] = await Promise.all([
        admin.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('courses').select('id, title, is_active').eq('is_active', true).order('title', { ascending: true }),
        supabase.from('locations').select('id, name').eq('is_active', true).order('name', { ascending: true }),
        admin.from('profiles').select('*').or('role.eq.training_officer,is_ojti.eq.true').order('full_name', { ascending: true }),
        admin.from('sessions').select(`*, course:course_id(title), location:location_id(name)`),
        supabase.from('student_progress').select('user_id, is_completed').eq('is_completed', true)
    ])

    return (
        <AtcoRoster
            atcos={atcos || []}
            courses={courses || []}
            locations={locations || []}
            ojtis={ojtis || []}
            sessions={allSessions || []}
            progress={progress || []}
        />
    )
}

function RosterSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-950/50 border border-white/5 flex-shrink-0" />
                        <div className="space-y-3 flex-1 md:w-64">
                            <div className="h-6 w-48 bg-zinc-800 rounded-lg" />
                            <div className="h-3 w-64 bg-zinc-900 rounded-md" />
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="h-14 flex-1 md:w-40 bg-zinc-950 border border-white/5 rounded-2xl" />
                        <div className="h-14 flex-1 md:w-40 bg-zinc-800 rounded-2xl" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default async function AssignmentsPage() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white leading-none">PERSONNEL COMMAND</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Controller Roster & Qualification Management</p>
                </div>
                <button className="w-full md:w-auto bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl">
                    <UserPlus className="w-4 h-4" />
                    Register Personnel
                </button>
            </header>

            <Suspense fallback={<RosterSkeleton />}>
                <RosterContent />
            </Suspense>
        </div>
    )
}

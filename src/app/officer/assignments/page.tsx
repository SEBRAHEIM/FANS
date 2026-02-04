import { createClient } from '@/lib/supabase/server'
import AtcoRoster from '@/components/AtcoRoster'
import { UserPlus } from 'lucide-react'

export default async function AssignmentsPage() {
    const supabase = await createClient()

    // Fetch ATCOs - use Admin client to bypass RLS for officer views
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data: atcos } = await admin
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

    // Fetch Courses
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title', { ascending: true })

    // Fetch Locations
    const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

    // Fetch OJTIs (Officers and users marked as OJTI)
    const { data: ojtis } = await admin
        .from('profiles')
        .select('*')
        .or('role.eq.training_officer,is_ojti.eq.true')
        .order('full_name', { ascending: true })

    // Fetch All Sessions for bulk syncing
    const { data: allSessions } = await admin
        .from('sessions')
        .select(`
            *,
            course:course_id(title),
            location:location_id(name)
        `)


    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white">MANAGE ATCOs</h2>
                    <p className="text-zinc-500 font-medium text-[13px] lg:text-base tracking-tight">Promote controller qualifications and designate OJTIs.</p>
                </div>
                <button className="w-full md:w-auto bg-zinc-900 border border-zinc-800 text-white px-8 py-4 xl:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group hover:border-blue-500/50">
                    <UserPlus className="w-5 h-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                    Add New Personnel
                </button>
            </header>

            <AtcoRoster
                atcos={atcos || []}
                courses={courses || []}
                locations={locations || []}
                ojtis={ojtis || []}
                sessions={allSessions || []}
            />
        </div>
    )
}

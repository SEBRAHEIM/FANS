import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import SessionManager from '@/components/SessionManager'

export default async function PlanningPage() {
    const supabase = await createClient()

    // Fetch active sessions with relations
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            *,
            atco:atco_id(full_name),
            course:course_id(title),
            ojti:ojti_id(full_name),
            location:location_id(name)
        `)
        .order('start_date', { ascending: false })

    // Fetch dependencies for the creator modal
    const { data: atcos } = await supabase.from('profiles').select('id, full_name')
    const { data: courses } = await supabase.from('courses').select('id, title').eq('is_active', true)
    const { data: locations } = await supabase.from('locations').select('id, name').eq('is_active', true)
    const { data: ojtis } = await supabase.from('profiles').select('id, full_name, is_ojti, role').or('role.eq.training_officer,is_ojti.eq.true')

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <SessionManager
                    initialSessions={sessions || []}
                    atcos={atcos || []}
                    courses={courses || []}
                    locations={locations || []}
                    ojtis={ojtis || []}
                />
            </main>
        </div>
    )
}

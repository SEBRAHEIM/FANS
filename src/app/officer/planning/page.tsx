import { createClient } from '@/lib/supabase/server'
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

    // Fetch dependencies for the creator modal - use Admin client to bypass RLS for officer views
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data: atcos } = await admin.from('profiles').select('id, full_name')


    const { data: ojtis } = await admin.from('profiles').select('id, full_name, is_ojti, role').or('role.eq.training_officer,is_ojti.eq.true')

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none">OPERATIONAL PLANNING</h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Coordinate Personnel & Simulator Deployment</p>
                </div>
            </header>
            <SessionManager
                initialSessions={sessions || []}
                atcos={atcos || []}
                ojtis={ojtis || []}
            />
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role={profile?.role || 'atco'} />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <CalendarView />
            </main>
        </div>
    )
}

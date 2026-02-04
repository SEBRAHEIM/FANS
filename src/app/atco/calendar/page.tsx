import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, calendar_token')
        .eq('id', user?.id)
        .single()

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <CalendarView calendarToken={profile?.calendar_token} />
        </div>
    )
}

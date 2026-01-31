import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import LocationManager from '@/components/LocationManager'

export default async function LocationsPage() {
    const supabase = await createClient()

    // Fetch locations
    const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <LocationManager initialLocations={locations || []} />
            </main>
        </div>
    )
}

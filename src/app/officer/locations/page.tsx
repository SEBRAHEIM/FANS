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
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <LocationManager initialLocations={locations || []} />
        </div>
    )
}

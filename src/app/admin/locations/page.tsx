import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { createLocation } from '@/app/admin/actions'
import { MapPin, Plus, Search, Building2 } from 'lucide-react'

export default async function ManageLocations() {
    const supabase = await createClient()

    const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="admin" />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Training Locations</h2>
                        <p className="text-zinc-400">Manage physical and virtual training facilities.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Location Form */}
                    <div className="lg:col-span-1">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-8">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-orange-500" />
                                Add New Location
                            </h3>
                            <form action={async (formData) => {
                                'use server'
                                await createLocation(formData)
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Location Name</label>
                                    <input
                                        name="name"
                                        required
                                        placeholder="e.g. Tower Simulator Room B"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Address / Description</label>
                                    <textarea
                                        name="address"
                                        rows={4}
                                        placeholder="Physical address or room details..."
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                </div>
                                <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-xl transition-all shadow-lg shadow-orange-500/10">
                                    Create Location
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* Location List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <input
                                placeholder="Search locations..."
                                className="bg-transparent border-none outline-none text-sm w-full py-1"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {locations?.map((location) => (
                                <div key={location.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4">
                                    <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 group-hover:bg-zinc-700 transition-colors">
                                        <Building2 className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{location.name}</h4>
                                        <p className="text-zinc-500 text-sm mt-1">{location.address}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-3 uppercase tracking-wider font-bold">
                                            <MapPin className="w-3 h-3" />
                                            Active facility
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {locations?.length === 0 && (
                                <div className="lg:col-span-2 text-center py-12 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                                    No locations added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

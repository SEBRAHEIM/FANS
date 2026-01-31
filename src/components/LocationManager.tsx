'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Location {
    id: string
    name: string
    is_active: boolean
}

interface LocationManagerProps {
    initialLocations: Location[]
}

export default function LocationManager({ initialLocations }: LocationManagerProps) {
    const router = useRouter()
    const [locations, setLocations] = useState(initialLocations)
    const [isAdding, setIsAdding] = useState(false)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase
            .from('locations')
            .insert([{ name: newName, is_active: true }])
            .select()

        if (error) {
            alert('Error adding location: ' + error.message)
        } else if (data) {
            setLocations([...locations, data[0]])
            setIsAdding(false)
            setNewName('')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this location?')) return

        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting location: ' + error.message)
        } else {
            setLocations(locations.filter(l => l.id !== id))
            router.refresh()
        }
    }

    return (
        <div className="space-y-8">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">SITE LOCATIONS</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Manage Tower, Center, and Simulator sites.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 xl:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Add Location
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map((loc) => (
                    <div key={loc.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative group hover:border-zinc-700 transition-all">
                        <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center text-blue-500 mb-6 border border-zinc-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">{loc.name}</h3>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Operational Site</p>

                        <button
                            onClick={() => handleDelete(loc.id)}
                            className="absolute top-6 right-6 p-3 text-zinc-700 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {locations.length === 0 && (
                    <div className="col-span-full bg-zinc-900 border border-zinc-800 p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <MapPin className="w-16 h-16 text-zinc-800 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Locations Defined</h3>
                        <p className="text-zinc-500 max-w-sm">Manage the physical sites and simulator facilities available for training sessions.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAdding(false)} />
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10">
                        <header className="mb-8 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">NEW LOCATION</h3>
                            <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-zinc-600" />
                            </button>
                        </header>
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Site Name</label>
                                <input
                                    required
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="e.g. EBBR Tower Simulator"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !newName}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                Register Site
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

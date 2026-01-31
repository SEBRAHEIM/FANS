import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Plus, Shield, Map, LayoutGrid, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Fetch real counts
    const [
        { count: atcoCount },
        { count: sessionCount },
        { count: locationCount },
        { count: courseCount }
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'atco'),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('locations').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true })
    ])

    const stats = [
        { label: 'Total ATCOs', value: atcoCount || 0, icon: Users, color: 'text-blue-500' },
        { label: 'Active Sessions', value: sessionCount || 0, icon: LayoutGrid, color: 'text-green-500' },
        { label: 'Available Locations', value: locationCount || 0, icon: Map, color: 'text-orange-500' },
        { label: 'Total Courses', value: courseCount || 0, icon: BookOpen, color: 'text-purple-500' },
    ]

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="admin" />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="w-6 h-6 text-red-500" />
                            Admin Console
                        </h2>
                        <p className="text-zinc-400">System management and oversight.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                <span className="text-2xl font-bold">{stat.value}</span>
                            </div>
                            <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">Quick Management</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link href="/admin/courses" className="flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all text-left">
                            <div>
                                <h4 className="font-medium text-white">Manage Courses</h4>
                                <p className="text-sm text-zinc-500">Add or edit training curricula</p>
                            </div>
                            <Plus className="w-5 h-5 text-zinc-400" />
                        </Link>
                        <Link href="/admin/sessions" className="flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all text-left">
                            <div>
                                <h4 className="font-medium text-white">Schedule Session</h4>
                                <p className="text-sm text-zinc-500">Create new training events</p>
                            </div>
                            <Plus className="w-5 h-5 text-zinc-400" />
                        </Link>
                        <Link href="/admin/locations" className="flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all text-left">
                            <div>
                                <h4 className="font-medium text-white">Manage Locations</h4>
                                <p className="text-sm text-zinc-500">Update facility details</p>
                            </div>
                            <Map className="w-5 h-5 text-zinc-400" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    )
}

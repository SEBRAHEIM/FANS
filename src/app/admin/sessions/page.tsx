import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { createSession } from '@/app/admin/actions'
import { Calendar, Plus, Users, MapPin, BookOpen, Clock } from 'lucide-react'

export default async function ManageSessions() {
    const supabase = await createClient()

    // Fetch all needed entities for the form
    const { data: courses } = await supabase.from('courses').select('id, title')
    const { data: locations } = await supabase.from('locations').select('id, name')
    const { data: instructors } = await supabase.from('profiles').select('id, full_name').eq('role', 'instructor')

    // Fetch existing sessions with joined data
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            *,
            course:courses(title),
            location:locations(name),
            instructor:profiles(full_name)
        `)
        .order('start_date', { ascending: true })

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="admin" />
            <main className="flex-1 p-8">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold">Training Schedule</h2>
                    <p className="text-zinc-400">Schedule and manage training events.</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Add Session Form */}
                    <div className="xl:col-span-1">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-8">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-500" />
                                Schedule Session
                            </h3>
                            <form action={createSession} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Course</label>
                                    <select name="course_id" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white">
                                        <option value="">Select a course</option>
                                        {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Instructor</label>
                                    <select name="instructor_id" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white">
                                        <option value="">Select an instructor</option>
                                        {instructors?.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Location</label>
                                    <select name="location_id" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white">
                                        <option value="">Select a location</option>
                                        {locations?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Start Date</label>
                                        <input type="datetime-local" name="start_date" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">End Date</label>
                                        <input type="datetime-local" name="end_date" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-xs" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Max Capacity</label>
                                    <input type="number" name="capacity" defaultValue={20} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                                </div>
                                <button className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-xl transition-all shadow-lg shadow-green-500/10">
                                    Confirm Session
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* Sessions Timeline */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {sessions?.map((session) => (
                                <div key={session.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6 group hover:border-zinc-700 transition-all">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-green-500/20">
                                                {session.status}
                                            </span>
                                            <h4 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">{session.course?.title}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Users className="w-4 h-4 text-zinc-600" />
                                                <span className="font-medium text-zinc-300">Instructor:</span> {session.instructor?.full_name}
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <MapPin className="w-4 h-4 text-zinc-600" />
                                                <span className="font-medium text-zinc-300">Location:</span> {session.location?.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Clock className="w-4 h-4 text-zinc-600" />
                                                <span className="font-medium text-zinc-300">Target:</span> {new Date(session.start_date).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                                        <button className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg border border-zinc-700 transition-colors">
                                            Manage Roster
                                        </button>
                                        <button className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg border border-zinc-700 transition-colors">
                                            Edit Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {sessions?.length === 0 && (
                                <div className="text-center py-24 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                                    <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500">No sessions scheduled yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

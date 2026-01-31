import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { Users, GraduationCap, Clipboard } from 'lucide-react'

export default async function InstructorDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const mySessions = [
        {
            id: '1',
            course: { title: 'Advanced Tower Procedures' },
            students: 12,
            start_date: new Date(Date.now() + 86400000).toISOString(),
            status: 'scheduled'
        },
        {
            id: '2',
            course: { title: 'LVP Operations Training' },
            students: 8,
            start_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            status: 'scheduled'
        }
    ]

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="instructor" />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold">Instructor Panel</h2>
                        <p className="text-zinc-400">Managing sessions for {profile?.full_name}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Clipboard className="w-5 h-5 text-indigo-500" />
                                    Sessions to Instruct
                                </h3>
                            </div>
                            <div className="divide-y divide-zinc-800">
                                {mySessions.map((session) => (
                                    <div key={session.id} className="p-4 hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-white">{session.course.title}</h4>
                                            <div className="text-sm text-zinc-500 flex gap-3 mt-1">
                                                <span>{new Date(session.start_date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 font-medium text-blue-400">
                                                    <Users className="w-3 h-3" />
                                                    {session.students} Students
                                                </span>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg border border-zinc-700 transition-colors">
                                            Roster
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
                            <GraduationCap className="w-8 h-8 mb-4 opacity-80" />
                            <h3 className="text-lg font-bold mb-1">Quick Action</h3>
                            <p className="text-sm text-indigo-100 mb-4 text-pretty">Update completion status for your last session.</p>
                            <button className="w-full py-2 bg-white text-indigo-600 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                                Mark Attendance
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

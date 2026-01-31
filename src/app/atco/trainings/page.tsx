import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { enrollInSession } from '@/app/atco/actions'
import { Calendar, MapPin, Clock, BookOpen, GraduationCap } from 'lucide-react'

export default async function AvailableTrainings() {
    const supabase = await createClient()

    // Get available sessions (not full, and not already enrolled)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            *,
            course:courses(title, description),
            location:locations(name),
            instructor:profiles(full_name)
        `)
        .eq('status', 'scheduled')
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

    // Fetch user's current enrollments to hide/disable join button
    const { data: myEnrollments } = await supabase
        .from('enrollments')
        .select('session_id')
        .eq('user_id', user?.id)

    const enrolledSessionIds = myEnrollments?.map(e => e.session_id) || []

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold">Training Catalog</h2>
                        <p className="text-zinc-400">Browse and enroll in upcoming specialized sessions.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions?.map((session) => {
                        const isEnrolled = enrolledSessionIds.includes(session.id)

                        return (
                            <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col group hover:border-blue-500/30 transition-all shadow-xl hover:shadow-blue-500/5">
                                <div className="p-6 flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-blue-500/10 p-3 rounded-2xl">
                                            <BookOpen className="w-6 h-6 text-blue-500" />
                                        </div>
                                        {isEnrolled && (
                                            <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
                                                Joined
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight line-clamp-1">
                                            {session.course?.title}
                                        </h3>
                                        <p className="text-zinc-500 text-sm mt-2 line-clamp-2">
                                            {session.course?.description}
                                        </p>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                            <Calendar className="w-4 h-4 text-zinc-600" />
                                            {new Date(session.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                            <MapPin className="w-4 h-4 text-zinc-600" />
                                            {session.location?.name}
                                        </div>
                                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                            <GraduationCap className="w-4 h-4 text-zinc-600" />
                                            Instr. {session.instructor?.full_name}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-zinc-800/50 border-t border-zinc-800">
                                    <form action={async (formData) => {
                                        'use server'
                                        await enrollInSession(formData)
                                    }}>
                                        <input type="hidden" name="session_id" value={session.id} />
                                        <button
                                            disabled={isEnrolled}
                                            className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-2xl transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
                                        >
                                            {isEnrolled ? 'Enrolled' : 'Request Enrollment'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )
                    })}
                    {sessions?.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
                            <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-zinc-400">No sessions available</h3>
                            <p className="text-zinc-600 text-sm">Check back later for new training schedules.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

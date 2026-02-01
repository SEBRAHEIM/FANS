'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Plus, Users, MapPin, BookOpen, Clock, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Session {
    id: string
    atco_id: string
    course_id: string
    ojti_id: string
    location_id: string
    start_date: string
    status: string
    notes: string
    atco: { full_name: string }
    course: { title: string }
    ojti: { full_name: string }
    location: { name: string }
    location_manual?: string
    course_manual?: string
}

interface SessionManagerProps {
    initialSessions: Session[]
    atcos: any[]
    courses: any[]
    locations: any[]
    ojtis: any[]
}

export default function SessionManager({ initialSessions, atcos, courses, locations, ojtis }: SessionManagerProps) {
    const router = useRouter()
    const [sessions, setSessions] = useState(initialSessions)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newSession, setNewSession] = useState({
        atco_id: '',
        course_id: 'manual',
        course_manual: '',
        ojti_id: '',
        location_id: 'manual',
        location_manual: '',
        start_date: '',
        notes: ''
    })

    const supabase = createClient()

    async function handleCreateSession(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
            .from('sessions')
            .insert([{
                atco_id: newSession.atco_id,
                course_id: newSession.course_id === 'manual' ? null : newSession.course_id,
                course_manual: newSession.course_id === 'manual' ? newSession.course_manual : null,
                ojti_id: newSession.ojti_id || null,
                location_id: newSession.location_id === 'manual' ? null : newSession.location_id,
                location_manual: newSession.location_id === 'manual' ? newSession.location_manual : null,
                start_date: newSession.start_date,
                notes: newSession.notes,
                created_by: user?.id,
                status: 'scheduled'
            }])

        if (error) {
            alert('Error creating session: ' + error.message)
        } else {
            setIsAdding(false)
            setNewSession({
                atco_id: '',
                course_id: 'manual',
                course_manual: '',
                ojti_id: '',
                location_id: 'manual',
                location_manual: '',
                start_date: '',
                notes: ''
            })
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="space-y-8">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">TRAINING SCHEDULE</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Plan and coordinate upcoming training sessions and simulator slots.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 xl:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Session
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {sessions.map((session) => (
                    <div key={session.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-zinc-700 transition-all group">
                        <div className="flex items-center gap-6 flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 flex-1">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Controller</p>
                                    <p className="text-sm font-bold text-white">{session.atco?.full_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Course</p>
                                    <p className="text-sm font-bold text-zinc-300">
                                        {session.course_manual || session.course?.title || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Location</p>
                                    <p className="text-sm font-bold text-zinc-400">
                                        {session.location_manual || session.location?.name || 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-sm font-bold text-zinc-400">{new Date(session.start_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border",
                                session.status === 'scheduled' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                                {session.status}
                            </span>
                        </div>
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <CalendarIcon className="w-20 h-20 text-zinc-800 mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">No Active Sessions</h3>
                        <p className="text-zinc-500 max-w-md">The training calendar is currently clear. Scale up the operation by scheduling new events.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black sm:bg-black/80 backdrop-blur-xl" onClick={() => setIsAdding(false)} />
                    <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-zinc-950 sm:bg-zinc-900 border-x-0 sm:border border-zinc-800 sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                        <header className="mb-8 flex justify-between items-center sm:block">
                            <div className="sm:mb-2">
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">SCHEDULE SESSION</h3>
                                <p className="text-zinc-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">Coordinate personnel and assets</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all sm:absolute sm:top-8 sm:right-8">
                                <X className="w-6 h-6 text-zinc-600" />
                            </button>
                        </header>

                        <form onSubmit={handleCreateSession} className="flex-1 sm:flex-initial space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Controller (ATCO)</label>
                                    <select
                                        required
                                        value={newSession.atco_id}
                                        onChange={(e) => setNewSession({ ...newSession, atco_id: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                    >
                                        <option value="">Select ATCO...</option>
                                        {atcos.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Training / Course Name</label>
                                    <div className="space-y-3">
                                        <select
                                            value={newSession.course_id}
                                            onChange={(e) => setNewSession({ ...newSession, course_id: e.target.value, course_manual: e.target.value === 'manual' ? '' : newSession.course_manual })}
                                            className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                        >
                                            <option value="manual">Write Manually...</option>
                                            {courses.filter(c => !['ECT', 'CT', 'ECT Mastery', 'ECT Mastery: Electronic Coordination', 'CT: Practical Coordination Training'].includes(c.title)).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>

                                        {newSession.course_id === 'manual' && (
                                            <input
                                                required
                                                value={newSession.course_manual}
                                                onChange={(e) => setNewSession({ ...newSession, course_manual: e.target.value })}
                                                placeholder="e.g. Advanced Radar Simulation"
                                                className="w-full bg-zinc-900 sm:bg-zinc-950 border border-blue-500/30 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Instructor (Verified OJTI)</label>
                                    <select
                                        value={newSession.ojti_id}
                                        onChange={(e) => setNewSession({ ...newSession, ojti_id: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                    >
                                        <option value="">Select OJTI (Optional)...</option>
                                        {ojtis.map(o => (
                                            <option key={o.id} value={o.id}>
                                                {o.full_name} {o.is_ojti ? '(ATCO-OJTI)' : '(Training Officer)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Location / Site</label>
                                    <div className="space-y-3">
                                        <select
                                            value={newSession.location_id}
                                            onChange={(e) => setNewSession({ ...newSession, location_id: e.target.value, location_manual: e.target.value === 'manual' ? '' : newSession.location_manual })}
                                            className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                        >
                                            <option value="manual">Write Manually...</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>

                                        {newSession.location_id === 'manual' && (
                                            <input
                                                required
                                                value={newSession.location_manual}
                                                onChange={(e) => setNewSession({ ...newSession, location_manual: e.target.value })}
                                                placeholder="e.g. EBBR Gate A2"
                                                className="w-full bg-zinc-900 sm:bg-zinc-950 border border-blue-500/30 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newSession.start_date}
                                        onChange={(e) => setNewSession({ ...newSession, start_date: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 sm:[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Command Notes</label>
                                <textarea
                                    value={newSession.notes}
                                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                                    placeholder="Operational details, simulator requirements, etc."
                                    className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-blue-500 min-h-[100px] sm:min-h-[120px] resize-none shadow-inner"
                                />
                            </div>

                            <div className="pt-4 sm:pt-0">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-zinc-100 text-zinc-950 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Deploy Session
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="sm:hidden w-full text-zinc-500 font-bold py-6 text-sm uppercase tracking-widest"
                                >
                                    Go Back
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

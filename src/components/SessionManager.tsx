'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Plus, Users, MapPin, BookOpen, Clock, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import CalendarButton from './CalendarButton'

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
    ojtis: any[]
}

export default function SessionManager({ initialSessions, atcos, ojtis }: SessionManagerProps) {
    const router = useRouter()
    const [sessions, setSessions] = useState(initialSessions)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newSession, setNewSession] = useState({
        atco_id: '',
        course_manual: '',
        ojti_id: '',
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
                course_id: null,
                course_manual: newSession.course_manual,
                ojti_id: newSession.ojti_id || null,
                location_id: null,
                location_manual: newSession.location_manual,
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
                course_manual: '',
                ojti_id: '',
                location_manual: '',
                start_date: '',
                notes: ''
            })
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center bg-zinc-900/40 p-10 rounded-[2.5rem] border border-white/5">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">Active Deployment</h3>
                    <p className="text-zinc-500 text-xs font-medium">System current monitoring {sessions.length} active sessions.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-white text-zinc-950 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl flex items-center gap-3 hover:bg-blue-500 hover:text-white"
                >
                    <Plus className="w-4 h-4" />
                    Deploy Personnel
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sessions.map((session) => (
                    <div key={session.id} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] flex flex-col xl:flex-row items-center justify-between gap-10 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-8 flex-1">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                                <CalendarIcon className="w-7 h-7" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Incumbent</p>
                                    <p className="text-lg font-black text-white uppercase tracking-tight">{session.atco?.full_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Certification</p>
                                    <p className="text-sm font-bold text-zinc-300">
                                        {session.course_manual || session.course?.title || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Deployment Site</p>
                                    <p className="text-sm font-bold text-zinc-500">
                                        {session.location_manual || session.location?.name || 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Command Date</p>
                                    <p className="text-sm font-bold text-zinc-400">{new Date(session.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full xl:w-auto">
                            <span className={cn(
                                "text-[10px] font-black px-5 py-3 rounded-full uppercase tracking-widest border",
                                session.status === 'scheduled' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                                {session.status === 'scheduled' ? 'COMMAND ISSUED' : 'SIGNAL COMPLETED'}
                            </span>
                            <CalendarButton
                                title={`Training: ${session.course_manual || session.course?.title || 'Session'}`}
                                description={`Controller: ${session.atco?.full_name}\nOJTI: ${session.ojti?.full_name || 'N/A'}\nNotes: ${session.notes || ''}`}
                                location={session.location_manual || session.location?.name || ''}
                                startDate={session.start_date}
                            />
                        </div>
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="glass p-24 rounded-[3rem] flex flex-col items-center justify-center text-center">
                        <CalendarIcon className="w-20 h-20 text-zinc-800 mb-8" />
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">No Active Schedules</h3>
                        <p className="text-zinc-500 max-w-md font-medium leading-relaxed">Operational calendar is currently void of active deployments. Plan new sessions to scale operations.</p>
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
                                    <input
                                        required
                                        value={newSession.course_manual}
                                        onChange={(e) => setNewSession({ ...newSession, course_manual: e.target.value })}
                                        placeholder="e.g. Advanced Radar Simulation"
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                    />
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
                                    <input
                                        required
                                        value={newSession.location_manual}
                                        onChange={(e) => setNewSession({ ...newSession, location_manual: e.target.value })}
                                        placeholder="e.g. EBBR Gate A2"
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                    />
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

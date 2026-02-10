'use client'

import { useState } from 'react'
import { Users, UserPlus, BookOpen, CheckCircle, GraduationCap, Calendar } from 'lucide-react'
import AssignCourseModal from '@/components/AssignCourseModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Profile {
    id: string
    full_name: string
    username: string
    email: string
    is_ojti: boolean
}

interface Course {
    id: string
    title: string
}

interface Location {
    id: string
    name: string
}

interface AtcoRosterProps {
    atcos: Profile[]
    courses: Course[]
    locations: Location[]
    ojtis: Profile[]
    sessions: any[]
    progress: { user_id: string, is_completed: boolean }[]
}

export default function AtcoRoster({ atcos, courses, locations, ojtis, sessions, progress }: AtcoRosterProps) {
    const router = useRouter()
    const [selectedAtco, setSelectedAtco] = useState<{ id: string, name: string } | null>(null)

    return (
        <>
            <div className="grid grid-cols-1 gap-6">
                {atcos.map((atco) => {
                    const atcoProgress = progress.filter(p => p.user_id === atco.id)
                    const totalRequired = courses.length
                    const completed = atcoProgress.length
                    const percentage = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0

                    return (
                        <div key={atco.id} className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem] flex flex-col xl:flex-row items-center justify-between gap-10 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                            {/* Stats Badge */}
                            <div className="absolute top-0 right-0 p-1">
                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${atco.is_ojti ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-950 border-white/5 text-zinc-600'
                                    }`}>
                                    {atco.is_ojti ? 'COMMANDER / OJTI' : 'ACTIVE DUTY'}
                                </span>
                            </div>

                            <div className="flex items-center gap-8 w-full xl:w-auto">
                                <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-2xl font-black text-zinc-500 group-hover:text-blue-500 transition-all shadow-xl group-hover:shadow-blue-500/10">
                                    {atco.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white leading-none uppercase tracking-tight group-hover:text-blue-500 transition-colors">{atco.full_name}</h3>
                                    <p className="text-[11px] text-zinc-600 font-black uppercase tracking-widest flex items-center gap-2">
                                        INCUMBENT CODE: <span className="text-zinc-400">@{atco.username}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Progress Pulse */}
                            <div className="flex-1 w-full max-w-md space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Qualification Progress</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{completed}/{totalRequired} CERTIFIED</span>
                                </div>
                                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden flex gap-0.5">
                                    {Array.from({ length: totalRequired }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-full flex-1 transition-all duration-1000 ${i < completed ? 'bg-blue-600' : 'bg-zinc-900'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full xl:w-auto mt-4 xl:mt-0">
                                <Link
                                    href={`/officer/atcos/${atco.id}/calendar`}
                                    className="flex-1 xl:flex-none px-6 py-4 rounded-xl bg-zinc-950 border border-white/5 text-zinc-500 hover:text-white hover:border-blue-500/30 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    Schedule
                                </Link>
                                <button
                                    onClick={() => setSelectedAtco({ id: atco.id, name: atco.full_name })}
                                    className="flex-1 xl:flex-none bg-white text-zinc-950 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl hover:bg-blue-500 hover:text-white"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Assign
                                </button>
                                <button
                                    onClick={async () => {
                                        const { toggleOjtiStatus } = await import('@/app/officer/actions')
                                        await toggleOjtiStatus(atco.id, atco.is_ojti)
                                        router.refresh()
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${atco.is_ojti ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-950 border-white/5 text-zinc-800 hover:border-emerald-500/30'}`}
                                >
                                    <GraduationCap className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )
                })}

                {atcos.length === 0 && (
                    <div className="bg-zinc-900 border border-white/5 p-24 rounded-[3rem] flex flex-col items-center justify-center text-center">
                        <Users className="w-20 h-20 text-zinc-800 mb-8" />
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">No Personnel Records</h3>
                        <p className="text-zinc-500 max-w-sm font-medium leading-relaxed">System database is currently void of active controller profiles. Register personnel to begin deployment.</p>
                    </div>
                )}
            </div>

            <AssignCourseModal
                isOpen={!!selectedAtco}
                onClose={() => setSelectedAtco(null)}
                atcoId={selectedAtco?.id || ''}
                atcoName={selectedAtco?.name || ''}
                ojtis={ojtis}
            />
        </>
    )
}

'use client'

import { useState } from 'react'
import { Users, UserPlus, BookOpen, CheckCircle, GraduationCap, Calendar } from 'lucide-react'
import AssignCourseModal from '@/components/AssignCourseModal'
import BulkCalendarButton from '@/components/BulkCalendarButton'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
}

export default function AtcoRoster({ atcos, courses, locations, ojtis, sessions }: AtcoRosterProps) {
    const router = useRouter()
    const [selectedAtco, setSelectedAtco] = useState<{ id: string, name: string } | null>(null)

    return (
        <>
            <div className="grid grid-cols-1 gap-4">
                {atcos.map((atco) => (
                    <div key={atco.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-zinc-700 transition-all group">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl font-black text-zinc-400 group-hover:text-blue-500 transition-colors">
                                {atco.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white leading-none">{atco.full_name}</h3>
                                    {atco.is_ojti && (
                                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                                            OJTI
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-500 font-medium">@{atco.username} • {atco.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={async () => {
                                    const { toggleOjtiStatus } = await import('@/app/officer/actions')
                                    const result = await toggleOjtiStatus(atco.id, atco.is_ojti)
                                    if ('error' in result) {
                                        alert(result.error)
                                    } else {
                                        router.refresh()
                                    }
                                }}
                                className={`w-full sm:w-auto px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${atco.is_ojti ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white'}`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                {atco.is_ojti ? 'Revoke OJTI' : 'Make OJTI'}
                            </button>
                            <BulkCalendarButton
                                atcoName={atco.full_name}
                                sessions={sessions.filter(s => s.atco_id === atco.id)}
                            />
                            <button
                                onClick={() => setSelectedAtco({ id: atco.id, name: atco.full_name })}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[13px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <BookOpen className="w-4 h-4" />
                                Assign Training
                            </button>
                        </div>
                    </div>
                ))}

                {atcos.length === 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <Users className="w-16 h-16 text-zinc-800 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No ATCOs Found</h3>
                        <p className="text-zinc-500 max-w-sm">There are no air traffic controllers currently registered in the database.</p>
                    </div>
                )}
            </div>

            <AssignCourseModal
                isOpen={!!selectedAtco}
                onClose={() => setSelectedAtco(null)}
                atcoId={selectedAtco?.id || ''}
                atcoName={selectedAtco?.name || ''}
                courses={courses}
                locations={locations}
                ojtis={ojtis}
            />
        </>
    )
}

import { createClient } from '@/lib/supabase/server'
import { Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function OjtiCommand() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile to check if OJTI
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_ojti')
        .eq('id', user?.id)
        .single()

    if (!profile?.is_ojti) return null

    const { data: ojtiAssignments } = await supabase
        .from('sessions')
        .select(`
            id,
            start_date,
            status,
            course:courses(title),
            location:locations(name),
            atco:profiles!sessions_atco_id_fkey(full_name, username)
        `)
        .eq('ojti_id', user?.id)
        .order('start_date', { ascending: true })

    const typedOjtiAssignments = (ojtiAssignments as any[]) || []

    if (typedOjtiAssignments.length === 0) return null

    return (
        <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 animate-slide-up">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3 uppercase tracking-tighter text-white">
                <Users className="w-6 h-6 text-emerald-500 shadow-sm" />
                OJTI Command
            </h3>
            <div className="space-y-3">
                {typedOjtiAssignments.slice(0, 3).map((session: any) => (
                    <Link
                        key={session.id}
                        href={`/atco/sessions/${session.id}`}
                        className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group card-hover"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 text-[13px] shadow-sm">
                                {session.atco?.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="font-black text-sm text-white uppercase tracking-tight">{session.atco?.username}</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">{session.course?.title}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                    </Link>
                ))}
            </div>
        </div>
    )
}

export function OjtiCommandSkeleton() {
    return (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 h-48 animate-pulse" />
    )
}

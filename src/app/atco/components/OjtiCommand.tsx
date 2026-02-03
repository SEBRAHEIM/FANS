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
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                OJTI Command
            </h3>
            <div className="space-y-3">
                {typedOjtiAssignments.slice(0, 3).map((session: any) => (
                    <Link
                        key={session.id}
                        href={`/atco/sessions/${session.id}`}
                        className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-sm">
                                {session.atco?.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">{session.atco?.username}</p>
                                <p className="text-xs text-zinc-500">{session.course?.title}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
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

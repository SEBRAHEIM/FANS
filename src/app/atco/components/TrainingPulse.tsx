import { createClient } from '@/lib/supabase/server'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function TrainingPulse() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: myEnrollments } = await supabase
        .from('enrollments')
        .select('status')
        .eq('user_id', user?.id)

    const completedCount = myEnrollments?.filter(e => e.status === 'attended').length || 0

    return (
        <Link href="/atco/trainings" className="block bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 hover:border-blue-500/30 transition-all group">
            <h3 className="text-lg font-bold mb-6">Training Pulse</h3>
            <div className="flex items-end justify-between mb-6">
                <div>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Completed Units</p>
                    <span className="text-4xl sm:text-5xl font-black text-white">{completedCount}</span>
                </div>
                <CheckCircle2 className="w-12 h-12 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
            </div>
            <div className="pt-4 border-t border-zinc-800/50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-500">Yearly Goal</span>
                    <span className="text-xs font-bold text-blue-500">{Math.min((completedCount / 10 * 100), 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                        style={{ width: `${Math.min((completedCount / 10) * 100, 100)}%` }}
                    />
                </div>
            </div>
        </Link>
    )
}

export function TrainingPulseSkeleton() {
    return (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-3xl p-6 h-64 animate-pulse" />
    )
}

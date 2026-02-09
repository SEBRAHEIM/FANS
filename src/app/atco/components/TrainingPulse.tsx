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
        <Link href="/atco/trainings" className="block glass rounded-3xl p-6 sm:p-8 hover:border-blue-500/30 transition-all group card-hover animate-slide-up">
            <h3 className="text-lg font-black mb-6 uppercase tracking-tighter text-white">Training Pulse</h3>
            <div className="flex items-end justify-between mb-6">
                <div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1">Completed Units</p>
                    <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-sm">{completedCount}</span>
                </div>
                <CheckCircle2 className="w-14 h-14 text-blue-500/20 group-hover:text-blue-500 transition-all duration-500" />
            </div>
            <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Yearly Goal</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{Math.min((completedCount / 10 * 100), 100).toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
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

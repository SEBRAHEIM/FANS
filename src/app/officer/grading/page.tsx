import { createClient } from '@/lib/supabase/server'
import GradingInterface from '@/components/GradingInterface'
import { Target, AlertCircle } from 'lucide-react'

export default async function GradingPage() {
    const supabase = await createClient()

    // Fetch all submissions that need manual grading and are not yet graded
    const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
            *,
            atco:profiles!atco_id(full_name),
            assessment:assessments(title),
            responses:student_responses(
                *,
                question:questions(*)
            )
        `)
        .eq('needs_manual', true)
        .eq('graded', false)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Grading Fetch Error:', error)
    }

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 border-b border-white/5 pb-10">
                <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-emerald-500" />
                    <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Evaluation Pipeline</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">Grading Queue</h2>
                <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Requires manual verification of open-ended responses.
                </p>
            </header>

            <GradingInterface initialSubmissions={submissions || []} />
        </div>
    )
}

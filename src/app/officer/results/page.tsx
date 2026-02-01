import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import ExamResultCenter from '@/components/ExamResultCenter'

export default async function ResultsPage() {
    const supabase = await createClient()

    // Fetch results from the view we created
    const { data: results } = await supabase
        .from('exam_results')
        .select('*')
        .order('completed_at', { ascending: false })

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <ExamResultCenter initialResults={results || []} />
            </main>
        </div>
    )
}

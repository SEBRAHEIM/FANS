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
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <ExamResultCenter initialResults={results || []} />
        </div>
    )
}

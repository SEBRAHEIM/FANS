import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import ExamResultCenter from '@/components/ExamResultCenter'

export default async function ResultsPage() {
    const supabase = await createClient()

    // Fetch results with joins
    const { data: rawResults, error } = await supabase
        .from('results')
        .select(`
            *,
            atco:profiles!atco_id(full_name),
            course:courses(title),
            assessment:assessments(title)
        `)
        .order('created_at', { ascending: false })

    if (error) console.error('Results Fetch Error:', error)

    // Map to the interface expected by ExamResultCenter
    const results = rawResults?.map(r => ({
        id: r.id,
        user_id: r.atco_id,
        student_name: r.atco?.full_name,
        course_title: r.course?.title || r.assessment?.title,
        completed_at: r.created_at,
        score_percentage: r.score,
        pass: r.pass
    })) || []

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10 max-w-7xl mx-auto">
            <ExamResultCenter initialResults={results} />
        </div>
    )
}

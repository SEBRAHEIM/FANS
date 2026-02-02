import { createClient } from '@/lib/supabase/server'
import GradingInterface from '@/components/GradingInterface'

export default async function GradingPage() {
    const supabase = await createClient()

    // Fetch pending responses (is_correct is null)
    // Using quiz_questions as relationship name based on other components
    const { data: responses, error } = await supabase
        .from('student_responses')
        .select(`
            *,
            profiles:user_id(full_name),
            quiz_questions:question_id(
                question_text, 
                question_type, 
                correct_answer,
                module:course_modules(
                    id,
                    title,
                    course:courses(title)
                )
            )
        `)
        .is('is_correct', null)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Grading Fetch Error:', error)
    }

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <GradingInterface initialResponses={responses || []} />
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import Classroom from '@/components/Classroom'
import { notFound } from 'next/navigation'

export default async function ClassroomPage({ params }: { params: { courseId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return notFound()

    // Fetch course details, modules, and questions
    const { data: course } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            modules:course_modules(
                id,
                title,
                description,
                module_type,
                video_url,
                order_index,
                questions:quiz_questions(
                    id,
                    question_text,
                    question_type,
                    options,
                    order_index
                )
            )
        `)
        .eq('id', params.courseId)
        .single()

    if (!course) return notFound()

    // Fetch student progress
    const { data: progress } = await supabase
        .from('student_progress')
        .select('module_id')
        .eq('user_id', user.id)
        .eq('is_completed', true)

    const completedModuleIds = progress?.map(p => p.module_id) || []

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <Classroom
                    courseId={course.id}
                    courseTitle={course.title}
                    modules={course.modules || []}
                    initialProgress={completedModuleIds}
                />
            </main>
        </div>
    )
}

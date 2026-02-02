import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import Classroom from '@/components/Classroom'
import { notFound } from 'next/navigation'

export default async function ClassroomPage({ params }: { params: { courseId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return notFound()

    // Fetch course details, modules, and questions - LMS v2 Enhanced
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
                is_unskippable,
                order_index,
                questions:quiz_questions(
                    id,
                    question_text,
                    question_type,
                    options,
                    order_index
                ),
                checkpoints:module_checkpoints(
                    id,
                    timestamp_seconds,
                    is_blocking,
                    question:quiz_questions(
                        id,
                        question_text,
                        options,
                        correct_answer
                    )
                )
            )
        `)
        .eq('id', params.courseId)
        .single()

    if (!course) return notFound()

    // Fetch student progress - LMS v2 Enhanced
    const { data: progress } = await supabase
        .from('student_progress')
        .select('module_id, last_position_seconds, completed_checkpoints, is_completed')
        .eq('user_id', user.id)

    // Fetch assignment details for this user and course
    const { data: assignment } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', params.courseId)
        .eq('assigned_to', user.id)
        .single()

    const initialProgress = progress?.map(p => ({
        module_id: p.module_id,
        last_position_seconds: p.last_position_seconds,
        completed_checkpoints: p.completed_checkpoints,
        is_completed: p.is_completed
    })) || []

    return (
        <div className="flex flex-col lg:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-0 lg:p-12 pt-16 lg:pt-10">
                <Classroom
                    courseId={course.id}
                    courseTitle={course.title}
                    modules={(course.modules as any) || []}
                    initialProgress={initialProgress}
                    assignment={assignment}
                />
            </main>
        </div>
    )
}

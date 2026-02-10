import { createClient } from '@/lib/supabase/server'
import Classroom from '@/components/Classroom'
import { notFound } from 'next/navigation'

export default async function ClassroomPage({ params }: { params: { courseId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return notFound()

    // 1. Fetch assignment context
    const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
            *,
            course:courses(
                id,
                title,
                modules(*),
                assessments(*)
            )
        `)
        .eq('course_id', params.courseId)
        .eq('atco_id', user.id)
        .single()

    if (assignmentError || !assignment) return notFound()

    // 2. Fetch progress
    const { data: progress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('atco_id', user.id)
        .eq('course_id', params.courseId)

    return (
        <div className="p-0 lg:p-12 pt-20 lg:pt-10">
            <Classroom
                courseId={assignment.course_id}
                courseTitle={assignment.course?.title}
                modules={assignment.course?.modules || []}
                assessments={assignment.course?.assessments || []}
                initialProgress={progress || []}
                assignment={assignment}
            />
        </div>
    )
}

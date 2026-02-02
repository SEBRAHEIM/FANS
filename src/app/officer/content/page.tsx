import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import CourseManager from '@/components/CourseManager'

export default async function ContentPage() {
    const supabase = await createClient()

    // Fetch courses with their modules
    const { data: courses } = await supabase
        .from('courses')
        .select(`
            *,
            modules:course_modules(
                id,
                title,
                module_type,
                videos,
                order_index
            )
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <CourseManager initialCourses={courses || []} enableAssignments={true} />
        </div>
    )
}

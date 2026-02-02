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
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <CourseManager initialCourses={courses || []} enableAssignments={true} />
            </main>
        </div>
    )
}

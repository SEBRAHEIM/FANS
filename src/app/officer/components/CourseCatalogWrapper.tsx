import { createClient } from '@/lib/supabase/server'
import CourseManager from '@/components/CourseManager'

export default async function CourseCatalogWrapper() {
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

    return <CourseManager initialCourses={courses || []} enableAssignments={true} />
}

export function CourseCatalogSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-zinc-900 border border-zinc-800/50 rounded-[2.5rem]" />
            ))}
        </div>
    )
}

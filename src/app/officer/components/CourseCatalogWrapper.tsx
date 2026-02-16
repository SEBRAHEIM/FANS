'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TrainingCatalog from './TrainingCatalog'
import CourseEditor from './CourseEditor'
import { useSearchParams, useRouter } from 'next/navigation'

export default function CourseCatalogWrapper() {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()

    const editingId = searchParams.get('edit')
    const isNew = searchParams.get('new') === 'true'

    useEffect(() => {
        fetchCourses()
    }, [])

    async function fetchCourses() {
        setLoading(true)
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                modules:course_modules(id, title, module_type)
            `)
            .order('created_at', { ascending: false })

        if (data) setCourses(data)
        setLoading(false)
    }

    const closeEditor = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('edit')
        params.delete('new')
        router.push(`/officer/content?${params.toString()}`)
        fetchCourses() // Refresh list
    }

    if (loading && courses.length === 0) return <CourseCatalogSkeleton />

    return (
        <div className="animate-fade-in">
            <TrainingCatalog courses={courses} onRefresh={fetchCourses} />

            {(editingId || isNew) && (
                <CourseEditor
                    courseId={editingId || undefined}
                    onClose={closeEditor}
                />
            )}
        </div>
    )
}

export function CourseCatalogSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-zinc-900 border border-white/5 rounded-3xl" />
            ))}
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()

        // Fetch course with modules
        const { data: course, error: fetchError } = await supabase
            .from('courses')
            .select('*, course_modules(*), assessments(*)')
            .eq('id', params.id)
            .single()

        if (fetchError) throw fetchError

        // VALIDATION: Must have >= 1 module OR >= 1 assessment
        if ((course.course_modules?.length || 0) === 0 && (course.assessments?.length || 0) === 0) {
            return NextResponse.json({
                error: 'PUBLISH BLOCKED: Course must have at least 1 module or assessment.'
            }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('courses')
            .update({
                status: 'published',
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        await logAction('PUBLISH_COURSE', 'COURSE', params.id)

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch original course and modules
        const { data: original, error: fetchError } = await supabase
            .from('courses')
            .select('*, modules(*)')
            .eq('id', params.id)
            .single()

        if (fetchError) throw fetchError

        // Insert duplicate course
        const { data: duplicate, error: courseError } = await supabase
            .from('courses')
            .insert({
                title: `${original.title} (Copy)`,
                description: original.description,
                status: 'draft',
                owner_id: user.id,
                created_by: user.id,
                category: original.category,
                version: original.version,
                visibility_type: original.visibility_type || 'archive',
                type: original.type,
                cover_page_url: original.cover_page_url,
                detailed_content: original.detailed_content,
                objectives: original.objectives,
                target_audience: original.target_audience,
                instructors: original.instructors,
                custom_settings: original.custom_settings
            })
            .select()
            .single()

        if (courseError) throw courseError

        // Duplicate modules
        if (original.modules && original.modules.length > 0) {
            const modulesToInsert = original.modules.map((m: any) => ({
                course_id: duplicate.id,
                title: m.title,
                order_index: m.order_index,
                module_type: m.module_type,
                video_url: m.video_url,
                video_source: m.video_source,
                is_unskippable: m.is_unskippable,
                videos: m.videos
            }))

            const { error: modulesError } = await supabase
                .from('modules')
                .insert(modulesToInsert)

            if (modulesError) throw modulesError
        }

        await logAction('DUPLICATE_COURSE', 'COURSE', duplicate.id, { original_id: params.id })

        return NextResponse.json(duplicate)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

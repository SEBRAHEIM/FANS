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
                status: 'DRAFT',
                owner_id: user.id,
                builder_state: original.builder_state
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
                content: m.content
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

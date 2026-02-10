import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                modules(*),
                assessments(*)
            `)
            .eq('id', params.id)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { title, description, status } = body

        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (status !== undefined) {
            updateData.status = status.toLowerCase()
            if (status.toLowerCase() === 'published') {
                updateData.published_at = new Date().toISOString()
            } else if (status.toLowerCase() === 'archived') {
                updateData.archived_at = new Date().toISOString()
            }
        }

        const { data, error } = await supabase
            .from('courses')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        await logAction('UPDATE_COURSE', 'COURSE', params.id, updateData)

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

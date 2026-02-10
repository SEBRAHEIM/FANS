import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('courses')
            .update({
                status: 'draft',
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        await logAction('UNPUBLISH_COURSE', 'COURSE', params.id)

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

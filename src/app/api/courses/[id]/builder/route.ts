import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { builder_state } = body

        if (!builder_state) {
            return NextResponse.json({ error: 'builder_state is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('courses')
            .update({ builder_state, updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        // We don't log every minor builder update to avoid log spam, 
        // but the DB is updated for persistence.

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

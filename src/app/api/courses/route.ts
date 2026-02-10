import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const q = searchParams.get('q')

        const supabase = await createClient()
        let query = supabase
            .from('courses')
            .select(`
                *,
                modules(count),
                assessments(count)
            `)
            .order('updated_at', { ascending: false })

        if (status) {
            query = query.eq('status', status.toLowerCase())
        }

        if (q) {
            query = query.ilike('title', `%${q}%`)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, description } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('courses')
            .insert({
                title,
                description,
                status: 'draft',
                owner_id: user.id
            })
            .select()
            .single()

        if (error) throw error

        await logAction('CREATE_COURSE', 'COURSE', data.id, { title })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

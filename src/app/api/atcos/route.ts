import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'atco')
            .order('full_name')

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Fetch ATCOs Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
            session:sessions(
                start_date,
                end_date,
                course:courses(title),
                location:locations(name),
                instructor:profiles(full_name)
            )
        `)
        .eq('user_id', user.id)

    if (!enrollments) {
        return new NextResponse('No sessions found', { status: 404 })
    }

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FANS//Portal//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n'

    enrollments.forEach((e: any) => {
        const s = e.session
        const start = new Date(s.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const end = new Date(s.end_date || new Date(s.start_date).getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        icsContent += [
            'BEGIN:VEVENT',
            `SUMMARY:${s.course.title}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `LOCATION:${s.location?.name || 'FANS Center'}`,
            `DESCRIPTION:Training with ${s.instructor?.full_name || 'Assigned OJTI'}`,
            'END:VEVENT'
        ].join('\r\n') + '\r\n'
    })

    icsContent += 'END:VCALENDAR'

    return new NextResponse(icsContent, {
        headers: {
            'Content-Type': 'text/calendar',
            'Content-Disposition': 'attachment; filename="fans-training.ics"'
        }
    })
}

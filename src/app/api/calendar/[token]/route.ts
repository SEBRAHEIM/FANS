import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    const { token } = params
    const supabaseAdmin = createAdminClient()

    try {
        // 1. Find user by calendar_token
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('calendar_token', token)
            .single()

        if (profileError || !profile) {
            return new NextResponse('Invalid calendar token', { status: 404 })
        }

        const userId = profile.id

        // 2. Fetch all training items
        const { data: assignments } = await supabaseAdmin
            .from('course_assignments')
            .select(`
                *,
                course:courses(title, description)
            `)
            .eq('assigned_to', userId)

        const { data: directSessions } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                course:courses(title, description),
                location:locations(name),
                instructor:profiles(full_name)
            `)
            .eq('atco_id', userId)

        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select(`
                session:sessions(
                    *,
                    course:courses(title, description),
                    location:locations(name),
                    instructor:profiles(full_name)
                )
            `)
            .eq('user_id', userId)

        const enrolledSessions = (enrollments as any[])?.map(e => e.session) || []
        const mergedSessions = Array.from(new Map([...(directSessions || []), ...enrolledSessions].map(s => [s.id, s])).values())

        // 3. Generate ICS content
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        let ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//FANS Portal//ATCO Training//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:FANS Training (${profile.full_name})`,
            'X-WR-TIMEZONE:UTC',
            'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
            'X-PUBLISHED-TTL:PT1H'
        ].join('\r\n') + '\r\n'

        // Add Deadlines
        assignments?.forEach(assignment => {
            if (assignment.deadline) {
                const deadline = new Date(assignment.deadline)
                const deadlineStr = deadline.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                ics += [
                    'BEGIN:VEVENT',
                    `UID:assignment-${assignment.id}@fans-portal.com`,
                    `DTSTAMP:${now}`,
                    `DTSTART:${deadlineStr}`,
                    `DTEND:${deadlineStr}`,
                    `SUMMARY:Deadline: ${assignment.course?.title || 'Training Assignment'}`,
                    `DESCRIPTION:Course: ${assignment.course?.title || 'Unknown'}\\nStatus: ${assignment.status}`,
                    'STATUS:CONFIRMED',
                    'TRANSP:OPAQUE',
                    'END:VEVENT'
                ].join('\r\n') + '\r\n'
            }
        })

        // Add Sessions
        mergedSessions.forEach(session => {
            if (session.start_date) {
                const start = new Date(session.start_date)
                const end = session.end_date ? new Date(session.end_date) : new Date(start.getTime() + 60 * 60 * 1000)
                const startStr = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                const endStr = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

                const title = session.course_manual || session.course?.title || 'Training Session'
                const location = session.location_manual || session.location?.name || 'FANS Training Center'
                const description = `Instructor: ${session.instructor?.full_name || 'TBD'}${session.notes ? '\\nNotes: ' + session.notes : ''}`

                ics += [
                    'BEGIN:VEVENT',
                    `UID:session-${session.id}@fans-portal.com`,
                    `DTSTAMP:${now}`,
                    `DTSTART:${startStr}`,
                    `DTEND:${endStr}`,
                    `SUMMARY:Training: ${title}`,
                    `LOCATION:${location}`,
                    `DESCRIPTION:${description}`,
                    'STATUS:CONFIRMED',
                    'TRANSP:OPAQUE',
                    'END:VEVENT'
                ].join('\r\n') + '\r\n'
            }
        })

        ics += 'END:VCALENDAR'

        return new NextResponse(ics, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="fans-training-${userId}.ics"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        })

    } catch (error) {
        console.error('iCal feed error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

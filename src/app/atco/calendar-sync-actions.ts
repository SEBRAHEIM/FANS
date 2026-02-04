'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Generate .ics calendar file for ATCO assignments
 */
export async function generateCalendarFile() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const { data: assignments, error: assignmentsError } = await supabase
            .from('course_assignments')
            .select(`
                *,
                course:courses(title, description)
            `)
            .eq('assigned_to', user.id)
            .order('deadline', { ascending: true })

        // Fetch all sessions for the current ATCO
        const { data: directSessions, error: sessionsError } = await supabase
            .from('sessions')
            .select(`
                *,
                course:courses(title, description),
                location:locations(name),
                instructor:profiles(full_name)
            `)
            .eq('atco_id', user.id)
            .order('start_date', { ascending: true })

        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
                session:sessions(
                    *,
                    course:courses(title, description),
                    location:locations(name),
                    instructor:profiles(full_name)
                )
            `)
            .eq('user_id', user.id)

        if (assignmentsError || sessionsError || enrollmentsError) {
            throw assignmentsError || sessionsError || enrollmentsError
        }

        // Generate .ics file content
        const icsContent = generateICS(
            assignments || [],
            directSessions || [],
            (enrollments as any[])?.map(e => e.session) || []
        )

        return { success: true, data: icsContent }
    } catch (error: any) {
        console.error('Generate Calendar Error:', error)
        return { error: error.message || 'Failed to generate calendar' }
    }
}

/**
 * Generate ICS format from assignments and sessions
 */
function generateICS(assignments: any[], directSessions: any[], enrolledSessions: any[]): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FANS Portal//ATCO Training//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:FANS Training Schedule
X-WR-TIMEZONE:UTC
`

    // Add Course Assignments (Deadlines)
    assignments.forEach(assignment => {
        if (assignment.deadline) {
            const deadline = new Date(assignment.deadline)
            const deadlineStr = deadline.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
            const uid = `assignment-${assignment.id}@fans-portal.com`

            let description = `Course: ${assignment.course?.title || 'Unknown Course'}`
            if (assignment.time_limit_minutes) {
                description += `\\nTime Limit: ${assignment.time_limit_minutes} minutes`
            }
            description += `\\nStatus: ${assignment.status}`

            ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${deadlineStr}
DTEND:${deadlineStr}
SUMMARY:Deadline: ${assignment.course?.title || 'Training Assignment'}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`
        }
    })

    // Merge sessions
    const allSessions = Array.from(new Map([...directSessions, ...enrolledSessions].map(s => [s.id, s])).values())

    // Add Sessions
    allSessions.forEach(session => {
        if (session.start_date) {
            const start = new Date(session.start_date)
            // Default to 1 hour if no end_date
            const end = session.end_date ? new Date(session.end_date) : new Date(start.getTime() + 60 * 60 * 1000)

            const startStr = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
            const endStr = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
            const uid = `session-${session.id}@fans-portal.com`

            const title = session.course_manual || session.course?.title || 'Training Session'
            const location = session.location_manual || session.location?.name || 'FANS Training Center'
            let description = `Instructor: ${session.instructor?.full_name || 'TBD'}`
            if (session.notes) description += `\\nNotes: ${session.notes}`

            ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:Training: ${title}
LOCATION:${location}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`
        }
    })

    ics += 'END:VCALENDAR'
    return ics
}

/**
 * Get all assignments with deadlines for calendar view
 */
export async function getCalendarAssignments(atcoId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user && !atcoId) {
            return { error: 'Not authenticated' }
        }

        const targetId = atcoId || user?.id
        if (!targetId) return { error: 'No target user' }

        const { data: assignments } = await supabase
            .from('course_assignments')
            .select(`
                *,
                course:courses(title, description)
            `)
            .eq('assigned_to', targetId)
            .not('deadline', 'is', null)

        const { data: sessions } = await supabase
            .from('sessions')
            .select(`
                *,
                course:courses(title, description),
                location:locations(name),
                instructor:profiles(full_name)
            `)
            .eq('atco_id', targetId)

        const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
                session:sessions(
                    *,
                    course:courses(title, description),
                    location:locations(name),
                    instructor:profiles(full_name)
                )
            `)
            .eq('user_id', targetId)

        const enrollmentSessions = (enrollments as any[])?.map(e => e.session) || []
        const mergedSessions = Array.from(new Map([...(sessions || []), ...enrollmentSessions].map(s => [s.id, s])).values())

        // Map sessions to a format the calendar understands (using start_date as deadline for display)
        const sessionAsAssignments = mergedSessions.map(s => ({
            id: s.id,
            deadline: s.start_date,
            status: s.status,
            type: 'session',
            course: s.course || { title: s.course_manual || 'Training Session' }
        }))

        return { success: true, data: [...(assignments || []), ...sessionAsAssignments] }
    } catch (error: any) {
        console.error('Get Calendar Assignments Error:', error)
        return { error: error.message || 'Failed to fetch assignments' }
    }
}

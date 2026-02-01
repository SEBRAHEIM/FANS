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

        // Fetch all assignments for the current ATCO
        const { data: assignments, error } = await supabase
            .from('course_assignments')
            .select(`
                *,
                course:courses(title, description)
            `)
            .eq('assigned_to', user.id)
            .order('deadline', { ascending: true })

        if (error) throw error

        // Generate .ics file content
        const icsContent = generateICS(assignments || [])

        return { success: true, data: icsContent }
    } catch (error: any) {
        console.error('Generate Calendar Error:', error)
        return { error: error.message || 'Failed to generate calendar' }
    }
}

/**
 * Generate ICS format from assignments
 */
function generateICS(assignments: any[]): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FANS Portal//ATCO Training//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:FANS Training Assignments
X-WR-TIMEZONE:UTC
`

    assignments.forEach(assignment => {
        if (assignment.deadline) {
            const deadline = new Date(assignment.deadline)
            const deadlineStr = deadline.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
            const uid = `assignment-${assignment.id}@fans-portal.com`

            let description = `Course: ${assignment.course?.title || 'Unknown Course'}`
            if (assignment.time_limit_minutes) {
                description += `\\nTime Limit: ${assignment.time_limit_minutes} minutes`
            }
            if (assignment.max_quiz_retries) {
                description += `\\nMax Quiz Retries: ${assignment.max_quiz_retries}`
            }
            description += `\\nStatus: ${assignment.status}`

            ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${deadlineStr}
DTEND:${deadlineStr}
SUMMARY:${assignment.course?.title || 'Training Assignment'} - Deadline
DESCRIPTION:${description}
STATUS:CONFIRMED
SEQUENCE:0
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
export async function getCalendarAssignments() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const { data, error } = await supabase
            .from('course_assignments')
            .select(`
                *,
                course:courses(title, description)
            `)
            .eq('assigned_to', user.id)
            .not('deadline', 'is', null)
            .order('deadline', { ascending: true })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Get Calendar Assignments Error:', error)
        return { error: error.message || 'Failed to fetch assignments' }
    }
}

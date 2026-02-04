'use client'

import { Calendar } from 'lucide-react'

interface BulkCalendarButtonProps {
    atcoName: string
    sessions: any[]
    className?: string
}

export default function BulkCalendarButton({
    atcoName,
    sessions,
    className = ''
}: BulkCalendarButtonProps) {
    const generateICS = () => {
        if (sessions.length === 0) {
            alert('No sessions found for this ATCO.')
            return
        }

        const formatDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }

        const icsEvents = sessions.map(session => {
            const start = new Date(session.start_date)
            // If end_date is available use it, otherwise default to 1 hour
            const end = session.end_date ? new Date(session.end_date) : new Date(start.getTime() + 60 * 60 * 1000)

            const title = `Training: ${session.course_manual || session.course?.title || 'Session'}`
            const description = `Controller: ${atcoName}\nNotes: ${session.notes || ''}`
            const location = session.location_manual || session.location?.name || ''

            return [
                'BEGIN:VEVENT',
                `UID:${session.id}@fans-portal.com`,
                `DTSTAMP:${formatDate(new Date())}`,
                `DTSTART:${formatDate(start)}`,
                `DTEND:${formatDate(end)}`,
                `SUMMARY:${title}`,
                `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
                `LOCATION:${location}`,
                'END:VEVENT'
            ].join('\r\n')
        })

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//FANS Portal//Training Schedule//EN',
            ...icsEvents,
            'END:VCALENDAR'
        ].join('\r\n')

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${atcoName.replace(/\s+/g, '_')}_Schedule.ics`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                generateICS()
            }}
            disabled={sessions.length === 0}
            className={`w-full sm:w-auto px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-30 disabled:hover:border-zinc-800 disabled:hover:text-zinc-500 ${className}`}
            title="Export all sessions to calendar"
        >
            <Calendar className="w-4 h-4" />
            Add to Calendar
        </button>
    )
}

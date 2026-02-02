'use client'

import { Calendar } from 'lucide-react'

interface CalendarButtonProps {
    title: string
    description?: string
    location?: string
    startDate: string
    endDate?: string
    className?: string
}

export default function CalendarButton({
    title,
    description = '',
    location = '',
    startDate,
    endDate,
    className = ''
}: CalendarButtonProps) {
    const generateICS = () => {
        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000) // Default 1 hour

        const formatDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//FANS Portal//Training Schedule//EN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@fans-portal.com`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(start)}`,
            `DTEND:${formatDate(end)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
            `LOCATION:${location}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n')

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`)
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-bold ${className}`}
            title="Add to Calendar"
        >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sync</span>
        </button>
    )
}

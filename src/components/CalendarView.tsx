'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { generateCalendarFile, getCalendarAssignments } from '@/app/atco/calendar-sync-actions'

interface Assignment {
    id: string
    deadline: string
    status: string
    time_limit_minutes: number | null
    course: {
        title: string
    }
}

export default function CalendarView() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        fetchAssignments()
    }, [])

    async function fetchAssignments() {
        setLoading(true)
        const result = await getCalendarAssignments()
        if (result.success && result.data) {
            setAssignments(result.data)
        }
        setLoading(false)
    }

    async function handleDownloadCalendar() {
        setDownloading(true)
        const result = await generateCalendarFile()

        if (result.success && result.data) {
            // Create blob and download
            const blob = new Blob([result.data], { type: 'text/calendar;charset=utf-8' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'fans-training-calendar.ics'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } else {
            alert('Failed to generate calendar file')
        }

        setDownloading(false)
    }

    function getDaysInMonth(date: Date) {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        return { daysInMonth, startingDayOfWeek, year, month }
    }

    function getAssignmentsForDate(date: Date) {
        return assignments.filter(assignment => {
            const assignmentDate = new Date(assignment.deadline)
            return assignmentDate.toDateString() === date.toDateString()
        })
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30'
            case 'in_progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
            case 'overdue': return 'bg-red-500/20 text-red-500 border-red-500/30'
            case 'expired': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-3 h-3" />
            case 'in_progress': return <Clock className="w-3 h-3" />
            case 'overdue': return <AlertCircle className="w-3 h-3" />
            case 'expired': return <XCircle className="w-3 h-3" />
            default: return <CalendarIcon className="w-3 h-3" />
        }
    }

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    function previousMonth() {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-zinc-500">Loading calendar...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Training Calendar</h2>
                    <p className="text-sm text-zinc-500 mt-1">View all your assigned courses and deadlines</p>
                </div>
                <button
                    onClick={handleDownloadCalendar}
                    disabled={downloading || assignments.length === 0}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Generating...' : 'Sync to Phone'}
                </button>
            </div>

            {/* Calendar Navigation */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-zinc-400" />
                    </button>
                    <h3 className="text-xl font-black text-white">
                        {monthNames[month]} {year}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <ChevronRight className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const date = new Date(year, month, day)
                        const dayAssignments = getAssignmentsForDate(date)
                        const isToday = date.toDateString() === new Date().toDateString()

                        return (
                            <div
                                key={day}
                                className={`aspect-square border rounded-xl p-2 transition-all ${isToday
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : dayAssignments.length > 0
                                            ? 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
                                            : 'border-zinc-800 bg-zinc-900/50'
                                    }`}
                            >
                                <div className="flex flex-col h-full">
                                    <span className={`text-sm font-bold ${isToday ? 'text-blue-500' : 'text-zinc-400'}`}>
                                        {day}
                                    </span>
                                    <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                                        {dayAssignments.slice(0, 2).map(assignment => (
                                            <div
                                                key={assignment.id}
                                                className={`text-[8px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${getStatusColor(assignment.status)}`}
                                                title={assignment.course.title}
                                            >
                                                {getStatusIcon(assignment.status)}
                                                <span className="truncate flex-1">{assignment.course.title}</span>
                                            </div>
                                        ))}
                                        {dayAssignments.length > 2 && (
                                            <div className="text-[8px] text-zinc-600 px-1.5">
                                                +{dayAssignments.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Status Legend</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-500/20 border border-zinc-500/30" />
                        <span className="text-xs text-zinc-500">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/30" />
                        <span className="text-xs text-zinc-500">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                        <span className="text-xs text-zinc-500">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                        <span className="text-xs text-zinc-500">Overdue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/30" />
                        <span className="text-xs text-zinc-500">Expired</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

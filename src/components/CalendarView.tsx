'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, XCircle, Plus, BookOpen, MapPin } from 'lucide-react'
import { generateCalendarFile, getCalendarAssignments } from '@/app/atco/calendar-sync-actions'
import AssignCourseModal from './AssignCourseModal'

interface Assignment {
    id: string
    deadline: string
    status: string
    time_limit_minutes: number | null
    type?: 'assignment' | 'session'
    course_manual?: string
    location_manual?: string
    location?: { name: string }
    instructor?: { full_name: string }
    ojti_id?: string
    notes?: string
    course: {
        title: string
    }
}

interface CalendarViewProps {
    calendarToken?: string
    atcoId?: string
    atcoName?: string
    ojtis?: any[]
}

export default function CalendarView({ calendarToken, atcoId, atcoName, ojtis = [] }: CalendarViewProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const syncUrl = typeof window !== 'undefined'
        ? `${window.location.origin.replace('http', 'webcal')}/api/calendar/${calendarToken}`
        : ''

    useEffect(() => {
        fetchAssignments()
    }, [])

    async function fetchAssignments() {
        setLoading(true)
        const result = await getCalendarAssignments(atcoId)
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
                <div className="flex flex-wrap gap-3">
                    {!atcoId && (
                        <button
                            onClick={() => setShowSyncModal(true)}
                            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                        >
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            Connect to Phone
                        </button>
                    )}
                    {atcoId && (
                        <button
                            onClick={() => {
                                setSelectedAssignment(null)
                                setShowAssignModal(true)
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Assign Training
                        </button>
                    )}
                    <button
                        onClick={handleDownloadCalendar}
                        disabled={downloading || assignments.length === 0}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'Generating...' : 'Download .ics'}
                    </button>
                </div>
            </div>

            {/* Sync Modal */}
            {showSyncModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSyncModal(false)} />
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sync to your Phone</h3>
                        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                            Subscribe to your live training schedule. Any new sessions added by officers will automatically appear in your phone's calendar.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 overflow-hidden">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Your Subscription URL</label>
                                <div className="flex items-center gap-3">
                                    <code className="text-[11px] text-blue-400 font-mono truncate flex-1">{syncUrl}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(syncUrl)
                                            setCopied(true)
                                            setTimeout(() => setCopied(false), 2000)
                                        }}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">How to add:</h4>
                                <ul className="text-[11px] text-zinc-400 space-y-2 list-disc ml-4">
                                    <li><span className="text-zinc-300 font-bold">iOS / iPhone:</span> Settings &gt; Calendar &gt; Accounts &gt; Add Account &gt; Other &gt; Add Subscribed Calendar.</li>
                                    <li><span className="text-zinc-300 font-bold">Google Calendar:</span> On web, click "+" next to "Other calendars" &gt; From URL.</li>
                                    <li><span className="text-zinc-300 font-bold">Outlook:</span> Add Calendar &gt; Subscribe from web.</li>
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSyncModal(false)}
                            className="w-full mt-8 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-bold transition-all"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

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
                                onClick={() => {
                                    if (atcoId) {
                                        setSelectedAssignment(null)
                                        // Set to local midnight to avoid timezone jumps when converting to Date object
                                        const localDate = new Date(year, month, day, 0, 0, 0, 0)
                                        setSelectedDate(localDate.toISOString())
                                        setShowAssignModal(true)
                                    }
                                }}
                                className={`aspect-square border rounded-xl p-2 transition-all group/day ${isToday
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : dayAssignments.length > 0
                                        ? 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
                                        : 'border-zinc-800 bg-zinc-900/50'
                                    } ${atcoId ? 'hover:border-blue-500/50 cursor-pointer active:scale-95' : ''}`}
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-bold ${isToday ? 'text-blue-500' : 'text-zinc-400'}`}>
                                            {day}
                                        </span>
                                        {atcoId && dayAssignments.length === 0 && (
                                            <Plus className="w-3 h-3 text-blue-500 opacity-0 group-hover/day:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                    <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                                        {dayAssignments.slice(0, 3).map(assignment => {
                                            const timeStr = new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            const loc = assignment.location_manual || assignment.location?.name

                                            return (
                                                <button
                                                    key={assignment.id}
                                                    disabled={!atcoId || assignment.type !== 'session'}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (assignment.type === 'session') {
                                                            setSelectedAssignment(assignment)
                                                            setShowAssignModal(true)
                                                        }
                                                    }}
                                                    className={`w-full text-left text-[7px] px-1.5 py-1 rounded border flex flex-col gap-0.5 transition-all ${getStatusColor(assignment.status)} ${atcoId && assignment.type === 'session' ? 'hover:scale-[1.02] active:scale-95 cursor-pointer ring-offset-zinc-900 hover:ring-1 hover:ring-blue-500/50' : 'cursor-default'}`}
                                                    title={`${timeStr} - ${assignment.course.title}${loc ? ` @ ${loc}` : ''}`}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {getStatusIcon(assignment.status)}
                                                        <span className="font-black uppercase tracking-tighter text-[8px] text-white/90">{timeStr}</span>
                                                    </div>
                                                    <span className="truncate font-bold leading-tight">{assignment.course.title}</span>
                                                    {loc && (
                                                        <span className="truncate text-[6px] opacity-70 flex items-center gap-0.5">
                                                            <MapPin className="w-2 h-2" />
                                                            {loc}
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                        {dayAssignments.length > 3 && (
                                            <div className="text-[8px] text-zinc-600 px-1.5 font-bold">
                                                +{dayAssignments.length - 3} more
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

            <AssignCourseModal
                isOpen={showAssignModal}
                onClose={() => {
                    setShowAssignModal(false)
                    fetchAssignments()
                }}
                atcoId={atcoId || ''}
                atcoName={atcoName || ''}
                ojtis={ojtis}
                initialData={selectedAssignment ? {
                    id: selectedAssignment.id,
                    course_manual: selectedAssignment.course_manual || selectedAssignment.course.title,
                    location_manual: selectedAssignment.location_manual,
                    ojti_id: selectedAssignment.ojti_id,
                    start_date: selectedAssignment.deadline,
                    notes: selectedAssignment.notes
                } : selectedDate ? {
                    id: '',
                    start_date: selectedDate
                } : null}
            />
        </div>
    )
}

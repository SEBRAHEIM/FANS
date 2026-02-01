'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Calendar, Users, CheckCircle2 } from 'lucide-react'
import { assignCourse } from '@/app/officer/assignment-actions'

interface CourseAssignmentProps {
    isOpen: boolean
    onClose: () => void
    courseId: string
    courseTitle: string
}

interface ATCO {
    id: string
    full_name: string
    email: string
}

export default function CourseAssignment({ isOpen, onClose, courseId, courseTitle }: CourseAssignmentProps) {
    const [atcos, setAtcos] = useState<ATCO[]>([])
    const [selectedAtcos, setSelectedAtcos] = useState<string[]>([])
    const [deadline, setDeadline] = useState('')
    const [timeLimit, setTimeLimit] = useState('')
    const [maxQuizRetries, setMaxQuizRetries] = useState('3')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchAtcos()
            setSuccess(false)
        }
    }, [isOpen])

    async function fetchAtcos() {
        try {
            const response = await fetch('/api/atcos')
            const data = await response.json()
            setAtcos(data || [])
        } catch (error) {
            console.error('Failed to fetch ATCOs:', error)
        }
    }

    function toggleAtco(atcoId: string) {
        setSelectedAtcos(prev =>
            prev.includes(atcoId)
                ? prev.filter(id => id !== atcoId)
                : [...prev, atcoId]
        )
    }

    function selectAll() {
        setSelectedAtcos(atcos.map(a => a.id))
    }

    function deselectAll() {
        setSelectedAtcos([])
    }

    async function handleAssign() {
        if (selectedAtcos.length === 0) {
            alert('Please select at least one ATCO')
            return
        }

        setLoading(true)

        const result = await assignCourse(
            courseId,
            selectedAtcos,
            deadline || null,
            timeLimit ? parseInt(timeLimit) : null,
            maxQuizRetries ? parseInt(maxQuizRetries) : 3
        )

        setLoading(false)

        if (result.error) {
            alert('Error: ' + result.error)
        } else {
            setSuccess(true)
            setTimeout(() => {
                onClose()
                setSelectedAtcos([])
                setDeadline('')
                setTimeLimit('')
                setMaxQuizRetries('3')
                setSuccess(false)
            }, 2000)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Assign Course</h2>
                        <p className="text-sm text-zinc-500 font-medium mt-1">{courseTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Assigned Successfully!</h3>
                            <p className="text-zinc-500">Course assigned to {selectedAtcos.length} ATCO{selectedAtcos.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* ATCO Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Select ATCOs
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={selectAll}
                                            className="text-xs text-blue-500 hover:text-blue-400 font-bold"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-zinc-700">|</span>
                                        <button
                                            onClick={deselectAll}
                                            className="text-xs text-zinc-500 hover:text-zinc-400 font-bold"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2">
                                    {atcos.length === 0 ? (
                                        <p className="text-zinc-600 text-sm text-center py-4">No ATCOs found</p>
                                    ) : (
                                        atcos.map(atco => (
                                            <label
                                                key={atco.id}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 cursor-pointer transition-all group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAtcos.includes(atco.id)}
                                                    onChange={() => toggleAtco(atco.id)}
                                                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{atco.full_name}</p>
                                                    <p className="text-xs text-zinc-600">{atco.email}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-zinc-600 mt-2">{selectedAtcos.length} ATCO{selectedAtcos.length !== 1 ? 's' : ''} selected</p>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <Calendar className="w-4 h-4" />
                                    Deadline (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Time Limit */}
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4" />
                                    Time Limit (Optional)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={timeLimit}
                                        onChange={(e) => setTimeLimit(e.target.value)}
                                        placeholder="60"
                                        min="1"
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-zinc-500 font-bold">minutes</span>
                                </div>
                                <p className="text-xs text-zinc-600 mt-2">Once started, ATCOs must complete the course within this time</p>
                            </div>

                            {/* Max Quiz Retries */}
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Max Quiz Retries
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={maxQuizRetries}
                                        onChange={(e) => setMaxQuizRetries(e.target.value)}
                                        placeholder="3"
                                        min="1"
                                        max="10"
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-zinc-500 font-bold">attempts</span>
                                </div>
                                <p className="text-xs text-zinc-600 mt-2">Number of times ATCOs can retake quizzes before passing</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-800 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={loading || selectedAtcos.length === 0}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Assigning...' : `Assign to ${selectedAtcos.length} ATCO${selectedAtcos.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

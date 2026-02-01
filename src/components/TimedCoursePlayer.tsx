'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { updateTimeRemaining, completeAssignment, expireAssignment } from '@/app/atco/course-actions'
import Classroom from './Classroom'

interface TimedCoursePlayerProps {
    assignmentId: string
    courseId: string
    courseTitle: string
    timeLimitMinutes: number | null
    initialTimeRemaining: number | null // in seconds
    onComplete: () => void
    onExpire: () => void
    onExit: () => void
}

export default function TimedCoursePlayer({
    assignmentId,
    courseId,
    courseTitle,
    timeLimitMinutes,
    initialTimeRemaining,
    onComplete,
    onExpire,
    onExit
}: TimedCoursePlayerProps) {
    const router = useRouter()
    const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining || (timeLimitMinutes ? timeLimitMinutes * 60 : null))
    const [isExpired, setIsExpired] = useState(false)
    const [showExitWarning, setShowExitWarning] = useState(false)
    const [showExpirationModal, setShowExpirationModal] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastSaveRef = useRef<number>(Date.now())

    useEffect(() => {
        if (!timeRemaining || timeRemaining <= 0) return

        // Start countdown timer
        intervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (!prev || prev <= 1) {
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Save time remaining every 10 seconds
        const saveInterval = setInterval(() => {
            if (timeRemaining && timeRemaining > 0) {
                updateTimeRemaining(assignmentId, timeRemaining)
                lastSaveRef.current = Date.now()
            }
        }, 10000)

        // Cleanup
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            clearInterval(saveInterval)
        }
    }, [assignmentId, timeRemaining])

    // Check for time expiration
    useEffect(() => {
        if (timeRemaining === 0 && !isExpired && !showExpirationModal) {
            handleTimeExpired()
        }
    }, [timeRemaining, isExpired, showExpirationModal])

    // Warn before leaving page
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isExpired && timeRemaining && timeRemaining > 0) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isExpired, timeRemaining])

    async function handleTimeExpired() {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsExpired(true)
        setShowExpirationModal(true)

        // Auto-save final state
        await updateTimeRemaining(assignmentId, 0)
        await expireAssignment(assignmentId)

        // Redirect after 3 seconds
        setTimeout(() => {
            router.push('/atco/trainings?expired=true')
        }, 3000)
    }

    async function handleExpire() {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsExpired(true)
        await expireAssignment(assignmentId)
        onExpire()
    }

    async function handleComplete() {
        if (intervalRef.current) clearInterval(intervalRef.current)
        await completeAssignment(assignmentId)
        onComplete()
    }

    function handleExitClick() {
        if (timeRemaining && timeRemaining > 0 && !isExpired) {
            setShowExitWarning(true)
        } else {
            onExit()
        }
    }

    function formatTime(seconds: number | null): string {
        if (!seconds) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    function getTimeColor(): string {
        if (!timeRemaining) return 'text-zinc-500'
        if (timeRemaining < 300) return 'text-red-500' // < 5 minutes
        if (timeRemaining < 600) return 'text-yellow-500' // < 10 minutes
        return 'text-blue-500'
    }

    if (isExpired) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90">
                <div className="bg-zinc-900 border border-red-500 rounded-3xl p-12 max-w-md text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Time Expired</h2>
                    <p className="text-zinc-400 mb-8">
                        Your time limit has expired. This assignment has been marked as expired.
                    </p>
                    <button
                        onClick={onExit}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                        Exit
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Timer Bar */}
            {timeRemaining && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Clock className={`w-5 h-5 ${getTimeColor()}`} />
                                <span className={`text-2xl font-black tabular-nums ${getTimeColor()}`}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                            <div className="h-6 w-px bg-zinc-800" />
                            <span className="text-sm text-zinc-500 font-bold">{courseTitle}</span>
                        </div>
                        <button
                            onClick={handleExitClick}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                        >
                            Exit
                        </button>
                    </div>
                    {/* Progress Bar */}
                    {timeLimitMinutes && (
                        <div className="h-1 bg-zinc-800">
                            <div
                                className={`h-full transition-all duration-1000 ${timeRemaining < 300 ? 'bg-red-500' :
                                    timeRemaining < 600 ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}
                                style={{
                                    width: `${((timeRemaining || 0) / (timeLimitMinutes * 60)) * 100}%`
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Course Content */}
            <div className={timeRemaining ? 'pt-20' : ''}>
                <Classroom
                    courseId={courseId}
                    onComplete={handleComplete}
                />
            </div>

            {/* Exit Warning Modal */}
            {showExitWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowExitWarning(false)}
                    />
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-2">Exit Course?</h3>
                        <p className="text-zinc-400 text-center mb-6">
                            You still have {formatTime(timeRemaining)} remaining. If you exit now, the timer will continue running.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExitWarning(false)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => {
                                    setShowExitWarning(false)
                                    onExit()
                                }}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Exit Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Time Expiration Modal */}
            {showExpirationModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-lg">
                    <div className="text-center animate-in zoom-in-95 duration-500">
                        <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <Clock className="w-16 h-16 text-red-500" />
                        </div>
                        <h1 className="text-7xl font-black text-white mb-6 tracking-tighter uppercase">TIME'S UP!</h1>
                        <p className="text-zinc-400 text-2xl font-medium mb-3">
                            Your assignment time has expired
                        </p>
                        <p className="text-zinc-600 text-lg">
                            Redirecting to training history...
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

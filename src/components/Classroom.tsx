'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, HelpCircle, CheckCircle2, ChevronRight, Lock, Clock, ArrowRight, ArrowLeft, Send, Video, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import InteractivePlayer from './InteractivePlayer'

interface Module {
    id: string
    title: string
    description: string
    module_type: 'video' | 'quiz' | 'document' | 'live'
    video_url?: string
    is_unskippable?: boolean
    last_position_seconds?: number
    checkpoints?: Checkpoint[]
    questions?: Question[]
    videos?: { id: string, url: string, title: string, source: string }[]
}

interface Checkpoint {
    id: string
    timestamp_seconds: number
    is_blocking: boolean
    video_id?: string
    question: {
        id: string
        question_text: string
        options: string[]
    }
}

interface Question {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'multiple_selection' | 'fill_blanks' | 'written'
    options: string[]
    needs_manual_grading?: boolean
}

interface ClassroomProps {
    courseId: string
    courseTitle?: string
    modules?: Module[]
    initialProgress?: { module_id: string, last_position_seconds?: number, completed_checkpoints?: string[] }[]
    onComplete?: () => void
    timeRemaining?: number | null
    deadline?: string | null
    assignment?: {
        max_quiz_retries: number
        quiz_attempts: number
        quiz_passed: boolean
        id: string
    } | null
}

export default function Classroom({
    courseId,
    courseTitle = '',
    modules = [],
    initialProgress = [],
    onComplete,
    timeRemaining,
    deadline,
    assignment
}: ClassroomProps) {
    const router = useRouter()
    const [activeModuleIndex, setActiveModuleIndex] = useState(0)
    const [completedModules, setCompletedModules] = useState<string[]>(initialProgress.map(p => p.module_id))
    const [videoWatched, setVideoWatched] = useState(false)
    const [activeVideoIndex, setActiveVideoIndex] = useState(0)
    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const activeModule = modules[activeModuleIndex]
    const activeModuleProgress = initialProgress.find(p => p.module_id === activeModule?.id)
    const isModuleCompleted = completedModules.includes(activeModule?.id)
    const isLastModule = activeModuleIndex === modules.length - 1

    const supabase = createClient()

    // Attempts & Progress Logic
    const isRetryLimitExceeded = assignment && activeModule?.module_type === 'quiz' &&
        assignment.quiz_attempts >= assignment.max_quiz_retries &&
        !assignment.quiz_passed

    const isQuizPassed = assignment?.quiz_passed
    const isPendingGrading = activeModule?.module_type === 'quiz' &&
        !isModuleCompleted &&
        (activeModuleProgress as any)?.has_responses

    // LMS v2: Progress and Checkpoint logic
    const handleProgressUpdate = async (seconds: number) => {
        const { updateModuleProgress } = await import('@/app/atco/actions')
        await updateModuleProgress(activeModule.id, seconds, false)
    }

    const handleVideoEnd = async () => {
        if (activeModule.videos && activeVideoIndex < activeModule.videos.length - 1) {
            setActiveVideoIndex(activeVideoIndex + 1)
        } else {
            if (!isModuleCompleted && !activeModule.questions?.length) {
                const { updateModuleProgress } = await import('@/app/atco/actions')
                await updateModuleProgress(activeModule.id, 0, true)
                setCompletedModules([...completedModules, activeModule.id])
                router.refresh()
            }
            setVideoWatched(true)
        }
    }

    async function markModuleComplete(moduleId: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('student_progress')
            .upsert([{
                user_id: user.id,
                module_id: moduleId,
                is_completed: true,
                completed_at: new Date().toISOString()
            }])

        if (!error) {
            setCompletedModules([...completedModules, moduleId])
            router.refresh()
        }
    }

    async function submitQuiz(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const responses = activeModule.questions?.map(q => {
            const studentAns = quizAnswers[q.id]
            const isManual = q.question_type === 'written' || q.needs_manual_grading
            let isCorrect: boolean | null = null

            if (!isManual) {
                const correctAns = (q as any).correct_answer
                if (q.question_type === 'multiple_selection') {
                    const studentSet = new Set(studentAns as string[] || [])
                    const correctSet = new Set(String(correctAns).split('|'))
                    isCorrect = studentSet.size === correctSet.size && Array.from(studentSet).every(item => correctSet.has(item))
                } else {
                    isCorrect = String(studentAns || '').toLowerCase().trim() === String(correctAns || '').toLowerCase().trim()
                }
            }

            return {
                user_id: user.id,
                question_id: q.id,
                answer_text: Array.isArray(studentAns) ? studentAns.join('|') : String(studentAns || ''),
                is_correct: isCorrect
            }
        }) || []

        // Calculate score for objective questions
        let correctCount = 0
        let objectiveCount = 0
        activeModule.questions?.forEach(q => {
            const isManual = q.question_type === 'written' || q.needs_manual_grading
            if (!isManual) {
                objectiveCount++
                const studentAns = quizAnswers[q.id]
                const correctAns = (q as any).correct_answer // Assuming fetched from DB

                if (q.question_type === 'multiple_selection') {
                    const studentSet = new Set(studentAns as string[] || [])
                    const correctSet = new Set(String(correctAns).split('|'))
                    if (studentSet.size === correctSet.size && Array.from(studentSet).every(item => correctSet.has(item))) {
                        correctCount++
                    }
                } else if (String(studentAns || '').toLowerCase().trim() === String(correctAns || '').toLowerCase().trim()) {
                    correctCount++
                }
            }
        })

        const scorePercentage = objectiveCount > 0 ? Math.round((correctCount / objectiveCount) * 100) : null

        // Check if manual grading is needed for ANY question in this module
        const needsManualGrading = activeModule.questions?.some(q => q.question_type === 'written' || q.needs_manual_grading)

        const { error } = await supabase
            .from('student_responses')
            .upsert(responses)

        if (!error) {
            // Update progress
            // If manual grading is needed, we DON'T mark it as completed yet
            // The Training Officer will mark it as completed during grading
            const { data: progressData } = await supabase
                .from('student_progress')
                .upsert([{
                    user_id: user.id,
                    module_id: activeModule.id,
                    is_completed: !needsManualGrading,
                    score_percentage: needsManualGrading ? null : scorePercentage,
                    completed_at: !needsManualGrading ? new Date().toISOString() : null
                }], { onConflict: 'user_id,module_id' })
                .select()
                .single()

            if (!needsManualGrading) {
                setCompletedModules([...completedModules, activeModule.id])
            }

            // Update assignment attempts
            if (assignment) {
                const passed = !needsManualGrading && scorePercentage !== null && scorePercentage >= 80 // Assuming 80% pass
                await supabase
                    .from('course_assignments')
                    .update({
                        quiz_attempts: (assignment.quiz_attempts || 0) + 1,
                        quiz_passed: passed || assignment.quiz_passed // Keep passed if already passed
                    })
                    .eq('id', assignment.id)
            }

            setIsSubmitting(false)

            // Refresh the page to show updated progress
            router.refresh()

            // If there's an onComplete callback, call it
            if (onComplete) {
                onComplete()
            }

            // Check for branching logic
            const branching = (activeModule as any).branching_logic
            if (branching && branching.next_module_id) {
                const nextIdx = modules.findIndex(m => m.id === branching.next_module_id)
                if (nextIdx !== -1) setActiveModuleIndex(nextIdx)
            }
        } else {
            alert('Error submitting quiz: ' + error.message)
            setIsSubmitting(false)
        }
    }

    // Live class attendance tracking
    const handleLiveClass = async (url: string) => {
        window.open(url, '_blank')
        const { logAttendance } = await import('@/app/atco/actions')
        await logAttendance(activeModule.id)
        if (!isModuleCompleted) {
            setCompletedModules([...completedModules, activeModule.id])
            router.refresh()
        }
    }

    const renderQuizInputs = (q: Question) => {
        if (q.question_type === 'multiple_choice') {
            return (
                <div className="grid grid-cols-1 gap-2 md:gap-3">
                    {q.options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                            className={`text-left p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all text-xs md:text-sm font-bold flex items-center justify-between group ${quizAnswers[q.id] === opt ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                        >
                            <span className="flex-1 mr-2">{opt}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${quizAnswers[q.id] === opt ? 'border-white bg-white text-blue-600' : 'border-zinc-800 bg-zinc-950 text-transparent'}`}>
                                <CheckCircle2 className="w-3 h-3" />
                            </div>
                        </button>
                    ))}
                </div>
            )
        }

        if (q.question_type === 'multiple_selection') {
            return (
                <div className="grid grid-cols-1 gap-2 md:gap-3">
                    {q.options.map((opt) => {
                        const currentAnswers = (quizAnswers[q.id] as string[]) || []
                        const isSelected = currentAnswers.includes(opt)
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                    const nextAnswers = isSelected
                                        ? currentAnswers.filter(a => a !== opt)
                                        : [...currentAnswers, opt]
                                    setQuizAnswers({ ...quizAnswers, [q.id]: nextAnswers })
                                }}
                                className={`text-left p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all text-xs md:text-sm font-bold flex items-center justify-between group ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                            >
                                <span className="flex-1 mr-2">{opt}</span>
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white bg-white text-blue-600' : 'border-zinc-800 bg-zinc-950 text-transparent'}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            )
        }

        if (q.question_type === 'fill_blanks') {
            return (
                <div className="w-full">
                    <input
                        value={quizAnswers[q.id] || ''}
                        onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Type the correct phrase..."
                    />
                </div>
            )
        }

        if (q.question_type === 'written') {
            return (
                <div className="w-full">
                    <textarea
                        value={quizAnswers[q.id] || ''}
                        onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 text-xs md:text-sm font-medium focus:outline-none focus:border-blue-500 transition-all min-h-[120px] md:min-h-[150px] resize-none"
                        placeholder="Enter your detailed response here..."
                    />
                    <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-tight mt-3 leading-relaxed">This answer will be manually reviewed by a Training Officer.</p>
                </div>
            )
        }

        return null
    }

    if (!activeModule) return <div>No modules found.</div>

    return (
        <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-10rem)] bg-zinc-900 border border-zinc-800 rounded-none md:rounded-[2.5rem] overflow-hidden">
            {/* Sidebar flow */}
            <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/50 flex-shrink-0">
                <div className="p-5 md:p-8 border-b border-zinc-800">
                    <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Course Content</h3>
                    <h2 className="text-base md:text-lg font-bold text-white leading-tight line-clamp-1">{courseTitle}</h2>
                </div>
                <div className="flex-1 overflow-y-auto lg:overflow-y-auto overflow-x-auto flex lg:flex-col p-3 md:p-4 gap-2 no-scrollbar">
                    {modules.map((m, idx) => {
                        const isLocked = idx > 0 && !completedModules.includes(modules[idx - 1].id)
                        const isActive = idx === activeModuleIndex
                        const isDone = completedModules.includes(m.id)

                        return (
                            <button
                                key={m.id}
                                disabled={isLocked}
                                onClick={() => setActiveModuleIndex(idx)}
                                className={`flex-shrink-0 lg:w-full text-left p-4 rounded-2xl flex items-center justify-between group transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : isLocked ? 'opacity-40 grayscale cursor-not-allowed hidden lg:flex' : 'hover:bg-zinc-800 text-zinc-400'}`}
                            >
                                <div className="flex items-center gap-3 md:gap-4">
                                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : m.module_type === 'video' ? <Play className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                                    <div className="space-y-0.5">
                                        <p className={`text-[9px] md:text-xs font-bold ${isActive ? 'text-blue-200' : 'text-zinc-600'}`}>MOD {idx + 1}</p>
                                        <p className="text-[12px] md:text-[13px] font-bold line-clamp-1 whitespace-nowrap lg:whitespace-normal">{m.title}</p>
                                        {!isDone && m.module_type === 'quiz' && (activeModuleProgress as any)?.has_responses && (
                                            <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Pending Review</p>
                                        )}
                                    </div>
                                </div>
                                {isLocked && <Lock className="w-3 h-3 hidden md:block" />}
                            </button>
                        )
                    })}
                </div>
            </aside>

            {/* Main view content */}
            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 p-5 md:p-8 lg:p-12 overflow-y-auto">
                    {activeModule.module_type === 'live' ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-xl mx-auto">
                            <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                <Video className="w-10 h-10 text-white" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black tracking-tighter uppercase text-white">LIVE ONLINE CLASS</h2>
                                <p className="text-zinc-500 font-medium leading-relaxed">
                                    Click the button below to join the instructor for this session. Your attendance will be automatically logged.
                                </p>
                            </div>
                            <button
                                onClick={() => handleLiveClass(activeModule.video_url || '#')}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-4"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Launch Classroom
                            </button>
                            <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-4 py-2 rounded-full">
                                <Clock className="w-3 h-3" />
                                Starts at: Scheduled Session Time
                            </div>
                        </div>
                    ) : activeModule.module_type === 'video' ? (
                        <div className="space-y-8">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 space-y-6">
                                    <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-800">
                                        <InteractivePlayer
                                            url={activeModule.videos?.[activeVideoIndex]?.url || activeModule.video_url || ''}
                                            isUnskippable={activeModule.is_unskippable}
                                            initialTimestamp={activeVideoIndex === 0 ? (activeModuleProgress?.last_position_seconds || 0) : 0}
                                            checkpoints={activeModule.checkpoints?.filter(c => !c.video_id || c.video_id === activeModule.videos?.[activeVideoIndex]?.id) || []}
                                            onProgressUpdate={handleProgressUpdate}
                                            onEnded={handleVideoEnd}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-white">
                                            {activeModule.videos?.[activeVideoIndex]?.title || activeModule.title}
                                        </h2>
                                        <p className="text-zinc-400 font-medium leading-relaxed">{activeModule.description}</p>
                                    </div>
                                </div>

                                {activeModule.videos && activeModule.videos.length > 1 && (
                                    <div className="w-full lg:w-72 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Playlist</h4>
                                        <div className="space-y-2">
                                            {activeModule.videos.map((vid, vIdx) => (
                                                <button
                                                    key={vid.id}
                                                    onClick={() => setActiveVideoIndex(vIdx)}
                                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${vIdx === activeVideoIndex ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-500 hover:border-zinc-700'}`}
                                                >
                                                    <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-[10px] font-black">{vIdx + 1}</div>
                                                    <span className="text-xs font-bold truncate">{vid.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {videoWatched && activeModule.questions && activeModule.questions.some(q => (q as any).timing === 'final' || !(q as any).timing) && (
                                <div className="pt-10 border-t border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-700">
                                    <div className="text-center mb-10 space-y-2">
                                        <span className="bg-purple-600/10 text-purple-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-purple-500/20">Knowledge Validation</span>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Final Module Assessment</h3>
                                    </div>

                                    <form onSubmit={submitQuiz} className="space-y-8 max-w-2xl mx-auto">
                                        {activeModule.questions.filter(q => (q as any).timing === 'final' || !(q as any).timing).map((q, qIdx) => (
                                            <div key={q.id} className="bg-zinc-950/50 p-6 md:p-8 rounded-[2rem] border border-zinc-800/50 space-y-6">
                                                <h4 className="text-lg md:text-xl font-bold text-white leading-tight flex gap-4">
                                                    <span className="text-zinc-700">{qIdx + 1}</span>
                                                    {q.question_text}
                                                </h4>
                                                {/* Render Quiz Inputs (Reusing logic below) */}
                                                {renderQuizInputs(q)}
                                            </div>
                                        ))}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || isModuleCompleted}
                                            className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? 'Submitting...' : isModuleCompleted ? 'Assessment Completed' : 'Submit My Responses'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-10 max-w-2xl mx-auto">
                            <div className="text-center space-y-4">
                                <span className="bg-purple-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-purple-400/20">Module Quiz</span>
                                <h2 className="text-4xl font-black tracking-tighter uppercase text-white">{activeModule.title}</h2>
                                <p className="text-zinc-500 font-medium">{activeModule.description || 'Test your knowledge on the recent video module.'}</p>
                            </div>

                            <form onSubmit={submitQuiz} className="space-y-8 md:space-y-12">
                                {isRetryLimitExceeded ? (
                                    <div className="bg-red-500/10 border border-red-500/20 p-8 md:p-12 rounded-[2.5rem] text-center space-y-6 animate-in zoom-in-95 duration-500">
                                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
                                            <Lock className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Maximum Attempts Reached</h3>
                                            <p className="text-zinc-500 text-sm font-medium">You have used all {assignment?.max_quiz_retries} allowed attempts. Please contact your Training Officer for further action.</p>
                                        </div>
                                    </div>
                                ) : (
                                    activeModule.questions?.map((q, idx) => (
                                        <div key={q.id} className="bg-zinc-950/50 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-zinc-800/50">
                                            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
                                                <span className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500 flex-shrink-0 text-xs md:text-sm">{idx + 1}</span>
                                                <div className="flex-1 space-y-4 w-full">
                                                    <h4 className="text-base md:text-xl font-bold text-white leading-tight">{q.question_text}</h4>
                                                    {renderQuizInputs(q)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || isModuleCompleted}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-5 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : isModuleCompleted ? (
                                        <>
                                            {activeModule.questions?.some(q => q.question_type === 'written' || q.needs_manual_grading) ? (
                                                <>
                                                    <Clock className="w-5 h-5 text-amber-500" />
                                                    Pending Manual Review
                                                </>
                                            ) : isQuizPassed ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    Quiz Passed
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Quiz Completed
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit Your Responses
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <footer className="p-5 md:p-8 border-t border-zinc-800 bg-zinc-950/20 flex flex-col md:flex-row gap-6 justify-between items-center">
                    <button
                        disabled={activeModuleIndex === 0}
                        onClick={() => setActiveModuleIndex(activeModuleIndex - 1)}
                        className="flex items-center gap-3 text-zinc-500 font-bold hover:text-white disabled:opacity-30 transition-all order-2 sm:order-1"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm">Previous</span>
                    </button>
                    <div className="flex items-center gap-2 order-3 sm:order-2">
                        {modules.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeModuleIndex ? 'w-8 bg-blue-600' : 'w-2 bg-zinc-800'}`} />
                        ))}
                    </div>
                    {isLastModule ? (
                        <button
                            disabled={!isModuleCompleted}
                            onClick={() => router.push('/atco/trainings')}
                            className="w-full sm:w-auto bg-zinc-100 text-zinc-950 px-8 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 shadow-lg order-1 sm:order-3"
                        >
                            Finish Course
                        </button>
                    ) : (
                        <button
                            disabled={!isModuleCompleted}
                            onClick={() => setActiveModuleIndex(activeModuleIndex + 1)}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest disabled:opacity-30 transition-all order-1 sm:order-3"
                        >
                            Next Module
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </footer>
            </main>
        </div>
    )
}

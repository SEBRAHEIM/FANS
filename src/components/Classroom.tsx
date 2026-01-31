'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, HelpCircle, CheckCircle2, ChevronRight, Lock, Clock, ArrowRight, ArrowLeft, Send, Video } from 'lucide-react'
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
    current_timestamp?: number
    checkpoints?: Checkpoint[]
    questions?: Question[]
}

interface Checkpoint {
    id: string
    timestamp_seconds: number
    is_blocking: boolean
    question: {
        id: string
        question_text: string
        options: string[]
    }
}

interface Question {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'fill_blanks' | 'written'
    options: string[]
}

interface ClassroomProps {
    courseId: string
    courseTitle: string
    modules: Module[]
    initialProgress: { module_id: string, current_timestamp?: number, completed_checkpoints?: string[] }[]
}

export default function Classroom({ courseId, courseTitle, modules, initialProgress }: ClassroomProps) {
    const router = useRouter()
    const [activeModuleIndex, setActiveModuleIndex] = useState(0)
    const [completedModules, setCompletedModules] = useState<string[]>(initialProgress.map(p => p.module_id))
    const [videoWatched, setVideoWatched] = useState(false)
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const activeModule = modules[activeModuleIndex]
    const activeModuleProgress = initialProgress.find(p => p.module_id === activeModule?.id)
    const isModuleCompleted = completedModules.includes(activeModule?.id)
    const isLastModule = activeModuleIndex === modules.length - 1

    const supabase = createClient()

    // LMS v2: Progress and Checkpoint logic
    const handleProgressUpdate = async (seconds: number) => {
        const { updateModuleProgress } = await import('@/app/atco/actions')
        await updateModuleProgress(activeModule.id, seconds, false)
    }

    const handleVideoEnd = async () => {
        if (!isModuleCompleted) {
            const { updateModuleProgress } = await import('@/app/atco/actions')
            await updateModuleProgress(activeModule.id, 0, true) // Mark complete
            setCompletedModules([...completedModules, activeModule.id])
            router.refresh()
        }
        setVideoWatched(true)
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

        const responses = Object.entries(quizAnswers).map(([qId, answer]) => ({
            user_id: user.id,
            question_id: qId,
            answer_text: answer
        }))

        const { error } = await supabase
            .from('student_responses')
            .upsert(responses)

        if (!error) {
            await markModuleComplete(activeModule.id)
            setIsSubmitting(false)

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

    if (!activeModule) return <div>No modules found.</div>

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
            {/* Sidebar flow */}
            <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/50">
                <div className="p-8 border-b border-zinc-800">
                    <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Course Content</h3>
                    <h2 className="text-lg font-bold text-white leading-tight">{courseTitle}</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {modules.map((m, idx) => {
                        const isLocked = idx > 0 && !completedModules.includes(modules[idx - 1].id)
                        const isActive = idx === activeModuleIndex
                        const isDone = completedModules.includes(m.id)

                        return (
                            <button
                                key={m.id}
                                disabled={isLocked}
                                onClick={() => setActiveModuleIndex(idx)}
                                className={`w-full text-left p-4 rounded-2xl flex items-center justify-between group transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : isLocked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-zinc-800 text-zinc-400'}`}
                            >
                                <div className="flex items-center gap-4">
                                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : m.module_type === 'video' ? <Play className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                                    <div className="space-y-0.5">
                                        <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-zinc-600'}`}>MODULE {idx + 1}</p>
                                        <p className="text-[13px] font-bold line-clamp-1">{m.title}</p>
                                    </div>
                                </div>
                                {isLocked && <Lock className="w-3 h-3" />}
                            </button>
                        )
                    })}
                </div>
            </aside>

            {/* Main view content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
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
                            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-800">
                                <InteractivePlayer
                                    url={activeModule.video_url || ''}
                                    isUnskippable={activeModule.is_unskippable}
                                    initialTimestamp={activeModuleProgress?.current_timestamp || 0}
                                    checkpoints={activeModule.checkpoints || []}
                                    onProgressUpdate={handleProgressUpdate}
                                    onEnded={handleVideoEnd}
                                />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black tracking-tighter uppercase text-white">{activeModule.title}</h2>
                                <p className="text-zinc-400 font-medium leading-relaxed">{activeModule.description}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 max-w-2xl mx-auto">
                            <div className="text-center space-y-4">
                                <span className="bg-purple-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-purple-400/20">Module Quiz</span>
                                <h2 className="text-4xl font-black tracking-tighter uppercase text-white">{activeModule.title}</h2>
                                <p className="text-zinc-500 font-medium">{activeModule.description || 'Test your knowledge on the recent video module.'}</p>
                            </div>

                            <form onSubmit={submitQuiz} className="space-y-12">
                                {activeModule.questions?.map((q, idx) => (
                                    <div key={q.id} className="space-y-6 bg-zinc-950/50 p-8 rounded-[2rem] border border-zinc-800/50">
                                        <div className="flex items-start gap-4">
                                            <span className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-500">{idx + 1}</span>
                                            <h4 className="text-lg font-bold text-white pt-2 leading-tight">{q.question_text}</h4>
                                        </div>

                                        {q.question_type === 'multiple_choice' && (
                                            <div className="grid grid-cols-1 gap-3 ml-14">
                                                {q.options.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                                        className={`text-left p-5 rounded-2xl border transition-all text-sm font-bold flex items-center justify-between group ${quizAnswers[q.id] === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                                                    >
                                                        {opt}
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${quizAnswers[q.id] === opt ? 'border-white bg-white text-blue-600' : 'border-zinc-800 bg-zinc-950 text-transparent'}`}>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {q.question_type === 'written' && (
                                            <div className="ml-14">
                                                <textarea
                                                    value={quizAnswers[q.id] || ''}
                                                    onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all min-h-[150px] resize-none"
                                                    placeholder="Enter your detailed response here..."
                                                />
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight mt-3 ml-1 leading-relaxed">This answer will be manually reviewed by a Training Officer.</p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || isModuleCompleted}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : isModuleCompleted ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Quiz Completed
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
                <footer className="p-8 border-t border-zinc-800 bg-zinc-950/20 flex justify-between items-center">
                    <button
                        disabled={activeModuleIndex === 0}
                        onClick={() => setActiveModuleIndex(activeModuleIndex - 1)}
                        className="flex items-center gap-3 text-zinc-500 font-bold hover:text-white disabled:opacity-30 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        {modules.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeModuleIndex ? 'w-8 bg-blue-600' : 'w-2 bg-zinc-800'}`} />
                        ))}
                    </div>
                    {isLastModule ? (
                        <button
                            disabled={!isModuleCompleted}
                            onClick={() => router.push('/atco/trainings')}
                            className="bg-zinc-100 text-zinc-950 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 shadow-lg"
                        >
                            Finish Course
                        </button>
                    ) : (
                        <button
                            disabled={!isModuleCompleted}
                            onClick={() => setActiveModuleIndex(activeModuleIndex + 1)}
                            className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-30 transition-all"
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

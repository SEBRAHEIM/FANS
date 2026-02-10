'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, HelpCircle, CheckCircle2, ChevronRight, Lock, Clock, ArrowRight, ArrowLeft, Send, Video, Calendar, LayoutGrid, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import InteractivePlayer from './InteractivePlayer'

interface Module {
    id: string
    title: string
    description: string
    module_type: 'video' | 'quiz' | 'document' | 'live' | 'slides'
    video_url?: string
    is_unskippable?: boolean
    last_position_seconds?: number
    checkpoints?: Checkpoint[]
    questions?: Question[]
    videos?: { id: string, url: string, title: string, source: string }[]
    order_index: number
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
        correct_answer: string
    }
}

interface Question {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'multiple_selection' | 'fill_blanks' | 'written'
    options: string[]
    needs_manual_grading?: boolean
}

interface Assessment {
    id: string
    title: string
    description: string
    questions: any[]
}

interface ClassroomProps {
    courseId: string
    courseTitle?: string
    modules?: Module[]
    assessments?: Assessment[]
    initialProgress?: any[]
    onComplete?: () => void
    assignment?: any
}

export default function Classroom({
    courseId,
    courseTitle = '',
    modules = [],
    assessments = [],
    initialProgress = [],
    assignment
}: ClassroomProps) {
    const router = useRouter()
    const supabase = createClient()

    // Combine modules and assessments into a linear path
    const pathItems = [
        ...modules.map(m => ({ ...m, type: 'module' as const })),
        ...assessments.map(a => ({ ...a, type: 'assessment' as const, order_index: 9999 }))
    ].sort((a, b) => a.order_index - b.order_index)

    const [activeIndex, setActiveIndex] = useState(0)
    const [completedItems, setCompletedItems] = useState<string[]>(initialProgress.map(p => p.module_id || p.assessment_id))
    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [slides, setSlides] = useState<any[]>([])
    const [activeSlideIndex, setActiveSlideIndex] = useState(0)
    const [slidesLoading, setSlidesLoading] = useState(false)

    const activeItem = pathItems[activeIndex]
    const isCompleted = activeItem && completedItems.includes(activeItem.id)
    const isLast = activeIndex === pathItems.length - 1

    useEffect(() => {
        if (activeItem?.type === 'module' && (activeItem as Module).module_type === 'slides') {
            fetchSlides(activeItem.id)
        }
    }, [activeItem?.id])

    const fetchSlides = async (moduleId: string) => {
        setSlidesLoading(true)
        const { data } = await supabase
            .from('module_slides')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: true })
        if (data) setSlides(data)
        setActiveSlideIndex(0)
        setSlidesLoading(false)
    }

    const markItemComplete = async (itemId: string, type: 'module' | 'assessment') => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (type === 'module') {
            await supabase.from('student_progress').upsert({
                atco_id: user.id,
                course_id: courseId,
                module_id: itemId,
                is_completed: true,
                completed_at: new Date().toISOString()
            })
        }

        setCompletedItems(prev => [...prev, itemId])
        router.refresh()
    }

    const handleNext = async () => {
        if (activeIndex < pathItems.length - 1) {
            setActiveIndex(activeIndex + 1)
        } else {
            // Check if entire course is complete
            router.push('/atco/results')
        }
    }

    const submitAssessment = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !activeItem) return

        try {
            // 1. Create Submission
            const { data: sub, error: subError } = await supabase
                .from('submissions')
                .insert({
                    atco_id: user.id,
                    course_id: courseId,
                    assessment_id: activeItem.id,
                    needs_manual: true, // Assuming written/open for now based on FANS needs
                    graded: false
                })
                .select()
                .single()

            if (subError) throw subError

            // 2. Create Responses
            const responses = Object.entries(quizAnswers).map(([qId, ans]) => ({
                submission_id: sub.id,
                question_id: qId,
                answer_text: ans,
                atco_id: user.id
            }))

            const { error: resError } = await supabase.from('student_responses').insert(responses)
            if (resError) throw resError

            // 3. Mark internal state
            await markItemComplete(activeItem.id, 'assessment')
            handleNext()
        } catch (err: any) {
            alert('Submission Error: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!activeItem) return <div className="p-20 text-center text-white">NO TRAINING CONTENT AVAILABLE.</div>

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-10rem)] bg-zinc-950 border border-white/5 rounded-[3rem] overflow-hidden">
            <header className="h-24 shrink-0 border-b border-white/5 flex items-center justify-between px-10 bg-black/20">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">{courseTitle}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="h-1.5 w-32 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${((activeIndex + 1) / pathItems.length) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{activeIndex + 1} / {pathItems.length} OBJECTIVES</span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Training Progress</p>
                        <p className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">Active Level</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-10">
                <div className="max-w-5xl mx-auto">
                    {activeItem.type === 'module' ? (
                        <div className="space-y-12">
                            {(activeItem as Module).module_type === 'slides' && (
                                <div className="space-y-8 animate-in fade-in duration-700">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest rounded-lg">Operational Theory</span>
                                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{activeItem.title}</h1>
                                        </div>
                                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Slide {activeSlideIndex + 1} / {slides.length}</div>
                                    </div>

                                    <div className="aspect-video bg-zinc-900 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
                                        {slidesLoading ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full p-16">
                                                <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight border-b border-white/5 pb-4">{slides[activeSlideIndex]?.title}</h3>
                                                <div className="text-zinc-400 text-lg leading-relaxed font-medium">
                                                    {/* Simplified for now, can add complex element rendering back if needed */}
                                                    {slides[activeSlideIndex]?.content_json?.elements?.map((el: any) => el.type === 'text' && <p key={el.id} className="mb-4">{el.content}</p>)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))} disabled={activeSlideIndex === 0} className="flex-1 py-5 bg-zinc-950 border border-white/5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:border-white/20 transition-all disabled:opacity-20 text-zinc-500 hover:text-white flex items-center justify-center gap-2">
                                            <ArrowLeft className="w-4 h-4" /> Previous
                                        </button>
                                        <button onClick={() => {
                                            if (activeSlideIndex < slides.length - 1) setActiveSlideIndex(prev => prev + 1)
                                            else markItemComplete(activeItem.id, 'module')
                                        }} className="flex-[2] py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center gap-2">
                                            {activeSlideIndex < slides.length - 1 ? 'Next Slide' : 'Commit Module'}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(activeItem as Module).module_type === 'video' && (
                                <div className="space-y-8 animate-in fade-in duration-700">
                                    <div className="aspect-video bg-zinc-950 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                                        <InteractivePlayer
                                            url={(activeItem as Module).video_url || ''}
                                            isUnskippable={(activeItem as Module).is_unskippable}
                                            onEnded={() => markItemComplete(activeItem.id, 'module')}
                                        />
                                    </div>
                                    <div className="space-y-4 px-4">
                                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{activeItem.title}</h1>
                                        <p className="text-zinc-500 font-medium leading-relaxed max-w-4xl text-lg">{activeItem.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                                    <HelpCircle className="w-10 h-10" />
                                </div>
                                <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Knowledge Validation</h1>
                                <p className="text-zinc-500 text-lg font-medium">{activeItem.description || 'Provide operational responses to the items below.'}</p>
                            </div>

                            <form onSubmit={submitAssessment} className="space-y-8">
                                {(activeItem as any).questions?.map((q: any, idx: number) => (
                                    <div key={q.id} className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-8">
                                        <div className="flex gap-6">
                                            <span className="shrink-0 w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-400 border border-white/5">{(idx + 1).toString().padStart(2, '0')}</span>
                                            <h3 className="text-xl font-bold text-white leading-tight mt-1">{q.question_text}</h3>
                                        </div>
                                        <div className="pl-16">
                                            <textarea
                                                required
                                                placeholder="ENTER OPERATIONAL RESPONSE..."
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-6 text-[12px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-amber-500/50 min-h-[150px] placeholder:text-zinc-800 transition-all font-mono"
                                                value={quizAnswers[q.id] || ''}
                                                onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'TRANSMITTING...' : 'Transmit Assessment'}
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            <footer className="h-24 shrink-0 border-t border-white/5 bg-zinc-950 px-10 flex items-center justify-between">
                <button
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex(activeIndex - 1)}
                    className="p-4 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all disabled:opacity-30 active:scale-90"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    {pathItems.map((item, i) => (
                        <div
                            key={item.id}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-10 bg-blue-500' :
                                completedItems.includes(item.id) ? 'w-2 bg-emerald-500' : 'w-2 bg-zinc-800'
                                }`}
                        />
                    ))}
                </div>

                <button
                    disabled={!isCompleted}
                    onClick={handleNext}
                    className="px-10 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-30"
                >
                    {isLast ? 'Complete Course' : 'Next Objective'}
                </button>
            </footer>
        </div>
    )
}

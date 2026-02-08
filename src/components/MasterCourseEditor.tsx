'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Plus,
    Trash2,
    Type,
    Image as ImageIcon,
    Square,
    ChevronLeft,
    ChevronRight,
    Save,
    X,
    Move,
    Maximize2,
    Palette,
    AlignCenter,
    AlignLeft,
    AlignRight,
    AlignJustify,
    Bold,
    Italic,
    Underline,
    Sparkles,
    Settings,
    Layers,
    Video,
    HelpCircle,
    FileText,
    Play,
    CheckCircle2,
    List,
    ListOrdered,
    Type as TypeIcon,
    Table,
    Layout
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SlideElement {
    id: string
    type: 'text' | 'image' | 'shape' | 'video' | 'link'
    content: string
    x: number
    y: number
    width: number
    height: number
    fontSize?: number
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
    fontFamily?: string
    letterSpacing?: number
    lineHeight?: number
    opacity?: number
    textDecoration?: string
    textShadow?: string
    linkUrl?: string
    videoUrl?: string
}

interface Slide {
    id: string
    title: string
    background_url?: string
    elements: SlideElement[]
    order_index: number
    layout?: 'blank' | 'title' | 'title-content' | 'two-content'
    notes?: string
}

interface Question {
    text: string
    type: 'multiple_choice' | 'multiple_selection' | 'fill_blanks' | 'written'
    options: string[]
    correctAnswers: string[]
    timing: 'interactive' | 'final'
    targetVideoId?: string
    timestampSeconds?: number
    needsManualGrading?: boolean
}

interface MasterCourseEditorProps {
    module: {
        id: string
        title: string
        module_type: 'slides' | 'video' | 'quiz'
        video_url?: string
        video_source?: 'youtube' | 'vimeo' | 'storage'
        videos?: { id: string, url: string, title: string, source: string }[]
    }
    onChange: (updates: any) => void
    onClose: () => void
}

export default function MasterCourseEditor({ module, onChange, onClose }: MasterCourseEditorProps) {
    const supabase = createClient()

    // Slide State
    const [slides, setSlides] = useState<Slide[]>([])
    const [activeSlideIndex, setActiveSlideIndex] = useState(0)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const canvasRef = useRef<HTMLDivElement>(null)

    // Quiz State
    const [questions, setQuestions] = useState<Question[]>([])
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)

    // UI State
    const [activeRibbonTab, setActiveRibbonTab] = useState<'master' | 'insert' | 'design'>('master')
    const [loading, setLoading] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    const [draggedElementId, setDraggedElementId] = useState<string | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isResizing, setIsResizing] = useState(false)
    const [resizingElementId, setResizingElementId] = useState<string | null>(null)
    const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, clientX: 0, clientY: 0 })
    const [canvasScale, setCanvasScale] = useState(0.8)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (module.id) {
            fetchModuleContent()
        }
    }, [module.id, module.module_type])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setActiveSlideIndex(prev => Math.max(0, prev - 1))
            if (e.key === 'ArrowRight') setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [slides.length])

    async function fetchModuleContent() {
        setLoading(true)
        if (module.module_type === 'slides') {
            const { data, error } = await supabase
                .from('module_slides')
                .select('*')
                .eq('module_id', module.id)
                .order('order_index', { ascending: true })

            if (data && data.length > 0) {
                setSlides(data.map(s => ({
                    id: s.id,
                    title: s.title || '',
                    background_url: s.background_url,
                    elements: s.content_json?.elements || [],
                    order_index: s.order_index
                })))
            } else {
                setSlides([{
                    id: `new-${crypto.randomUUID()}`, // Prefix to identify new slides
                    title: 'Introduction',
                    elements: [
                        { id: crypto.randomUUID(), type: 'text', content: 'Double click to edit title', x: 10, y: 10, width: 80, height: 10, fontSize: 32, fontWeight: 'bold', textAlign: 'center' }
                    ],
                    order_index: 0
                }])
            }
        } else if (module.module_type === 'quiz') {
            const { data, error } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('module_id', module.id)
                .order('order_index', { ascending: true })

            if (data && data.length > 0) {
                setQuestions(data.map(q => ({
                    text: q.question_text,
                    type: q.question_type,
                    options: q.options || [],
                    correctAnswers: q.question_type === 'multiple_selection' ? (q.correct_answer?.split('|') || []) : [q.correct_answer || ''],
                    timing: q.timing || 'final',
                    targetVideoId: q.target_video_id,
                    timestampSeconds: q.timestamp_seconds,
                    needsManualGrading: q.needs_manual_grading
                })))
            } else {
                setQuestions([{
                    text: '',
                    type: 'multiple_choice',
                    options: ['', ''],
                    correctAnswers: [],
                    timing: 'final'
                }])
            }
        }
        setLoading(false)
    }

    // --- Persistence Handlers ---
    const [saving, setSaving] = useState(false)

    async function handleSaveSlides() {
        setSaving(true)
        const updates = slides.map((s, idx) => ({
            id: s.id.includes('-') ? undefined : s.id, // Check if it's a UUID (new) or existing
            module_id: module.id,
            title: s.title,
            background_url: s.background_url,
            content_json: { elements: s.elements },
            order_index: idx
        }))

        const { error } = await supabase
            .from('module_slides')
            .upsert(updates)

        if (error) {
            alert('Error saving slides: ' + error.message)
        } else {
            onChange({ ...module, slides })
            fetchModuleContent() // Refresh to get real IDs
        }
        setSaving(false)
    }

    async function handleSaveQuiz() {
        setSaving(true)
        // First delete existing questions to avoid duplicates/orphans if the list changed
        await supabase.from('quiz_questions').delete().eq('module_id', module.id)

        const formattedQuestions = questions.map((q, idx) => ({
            module_id: module.id,
            question_text: q.text,
            question_type: q.type,
            options: (q.type === 'multiple_choice' || q.type === 'multiple_selection') ? q.options : null,
            correct_answer: q.type === 'multiple_selection' ? q.correctAnswers.join('|') : q.correctAnswers[0] || '',
            order_index: idx + 1,
            needs_manual_grading: q.type === 'written' ? true : (q.needsManualGrading || false),
            timing: q.timing,
            target_video_id: q.timing === 'interactive' ? q.targetVideoId : null,
            timestamp_seconds: q.timing === 'interactive' ? q.timestampSeconds : null
        }))

        const { error } = await supabase
            .from('quiz_questions')
            .insert(formattedQuestions)

        if (error) {
            alert('Error saving quiz: ' + error.message)
        } else {
            onChange({ ...module, questions })
        }
        setSaving(false)
    }

    async function handleSaveVideo() {
        setSaving(true)
        const { error } = await supabase
            .from('course_modules')
            .update({ video_url: module.video_url, video_source: module.video_source })
            .eq('id', module.id)

        if (error) {
            alert('Error saving video settings: ' + error.message)
        } else {
            onChange(module)
        }
        setSaving(false)
    }

    // --- Slide Handlers ---
    const updateElement = (id: string, updates: Partial<SlideElement>) => {
        const newSlides = [...slides]
        const elementIndex = newSlides[activeSlideIndex].elements.findIndex(e => e.id === id)
        if (elementIndex === -1) return
        newSlides[activeSlideIndex].elements[elementIndex] = {
            ...newSlides[activeSlideIndex].elements[elementIndex],
            ...updates
        }
        setSlides(newSlides)
    }

    const deleteElement = (id: string) => {
        const newSlides = [...slides]
        newSlides[activeSlideIndex].elements = newSlides[activeSlideIndex].elements.filter(e => e.id !== id)
        setSlides(newSlides)
        setSelectedElementId(null)
    }

    const addElement = (type: 'text' | 'image' | 'shape') => {
        const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? 'New Content' : (type === 'image' ? 'https://via.placeholder.com/300' : 'Rectangle'),
            x: 20, y: 20, width: type === 'text' ? 60 : 30, height: type === 'text' ? 10 : 20,
            fontSize: type === 'text' ? 18 : undefined,
            color: type === 'shape' ? '#3b82f6' : '#ffffff',
            textAlign: type === 'text' ? 'left' : undefined,
            fontFamily: type === 'text' ? 'Inter' : undefined,
            letterSpacing: 0, lineHeight: 1.2, opacity: 1
        }
        const newSlides = [...slides]
        newSlides[activeSlideIndex].elements.push(newElement)
        setSlides(newSlides)
        setSelectedElementId(newElement.id)
    }

    const addNewSlide = () => {
        const newSlide: Slide = {
            id: `new-${crypto.randomUUID()}`,
            title: 'New Slide',
            elements: [],
            order_index: slides.length
        }
        setSlides([...slides, newSlide])
        setActiveSlideIndex(slides.length)
    }

    const deleteSlide = (index: number) => {
        if (slides.length <= 1) return
        const newSlides = slides.filter((_, i) => i !== index)
        setSlides(newSlides)
        if (activeSlideIndex >= newSlides.length) {
            setActiveSlideIndex(Math.max(0, newSlides.length - 1))
        }
    }

    const handleDragStart = (e: React.MouseEvent, id: string) => {
        if (selectedElementId !== id) setSelectedElementId(id)
        setDraggedElementId(id)
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const el = slides[activeSlideIndex].elements.find(item => item.id === id)
        if (!el) return

        setDragStart({
            x: ((e.clientX - rect.left) / rect.width) * 100 - el.x,
            y: ((e.clientY - rect.top) / rect.height) * 100 - el.y
        })
        setIsDragging(true)
    }

    const handleDragMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedElementId || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const newX = ((e.clientX - rect.left) / rect.width) * 100 - dragStart.x
        const newY = ((e.clientY - rect.top) / rect.height) * 100 - dragStart.y

        updateElement(draggedElementId, { x: newX, y: newY })
    }

    const handleResizeStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        e.preventDefault()
        const el = slides[activeSlideIndex].elements.find(item => item.id === id)
        if (!el) return

        setIsResizing(true)
        setResizingElementId(id)
        setResizeStart({
            width: el.width,
            height: el.height,
            clientX: e.clientX,
            clientY: e.clientY
        })
    }

    const handleResizeMove = (e: React.MouseEvent) => {
        if (!isResizing || !resizingElementId || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - resizeStart.clientX) / rect.width) * 100
        const deltaY = ((e.clientY - resizeStart.clientY) / rect.height) * 100

        updateElement(resizingElementId, {
            width: Math.max(2, resizeStart.width + deltaX),
            height: Math.max(2, resizeStart.height + deltaY)
        })
    }

    const handleDragEnd = () => {
        setIsDragging(false)
        setDraggedElementId(null)
        setIsResizing(false)
        setResizingElementId(null)
    }

    const handleImageUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `course-assets/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('fans-storage')
            .upload(filePath, file)

        if (uploadError) {
            alert('Error uploading image: ' + uploadError.message)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('fans-storage')
            .getPublicUrl(filePath)

        const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type: 'image',
            content: publicUrl,
            x: 25, y: 25, width: 50, height: 40,
            opacity: 1
        }

        const newSlides = [...slides]
        newSlides[activeSlideIndex].elements.push(newElement)
        setSlides(newSlides)
        setSelectedElementId(newElement.id)
    }

    const handleVideoUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `course-assets/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('fans-storage')
            .upload(filePath, file)

        if (uploadError) {
            alert('Error uploading video: ' + uploadError.message)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('fans-storage')
            .getPublicUrl(filePath)

        const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type: 'video',
            content: 'Local Video',
            videoUrl: publicUrl,
            x: 20, y: 20, width: 60, height: 40,
            opacity: 1
        }

        const newSlides = [...slides]
        newSlides[activeSlideIndex].elements.push(newElement)
        setSlides(newSlides)
        setSelectedElementId(newElement.id)
    }

    // --- Quiz Handlers ---
    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], ...updates }
        setQuestions(newQuestions)
    }

    const applyLayout = (layout: 'blank' | 'title' | 'title-content' | 'two-content') => {
        const newSlides = [...slides]
        const currentSlide = newSlides[activeSlideIndex]
        currentSlide.layout = layout

        let elements: SlideElement[] = []
        if (layout === 'title') {
            elements = [
                { id: crypto.randomUUID(), type: 'text', content: 'Click to add title', x: 10, y: 30, width: 80, height: 15, fontSize: 54, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', color: '#0f172a' },
                { id: crypto.randomUUID(), type: 'text', content: 'Click to add subtitle', x: 20, y: 50, width: 60, height: 10, fontSize: 24, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Inter', color: '#64748b' }
            ]
        } else if (layout === 'title-content') {
            elements = [
                { id: crypto.randomUUID(), type: 'text', content: 'Click to add title', x: 5, y: 5, width: 90, height: 12, fontSize: 44, fontWeight: 'bold', textAlign: 'left', fontFamily: 'Inter', color: '#0f172a' },
                { id: crypto.randomUUID(), type: 'text', content: 'Click to add content text...', x: 5, y: 20, width: 90, height: 70, fontSize: 18, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Inter', color: '#1e293b' }
            ]
        } else if (layout === 'two-content') {
            elements = [
                { id: crypto.randomUUID(), type: 'text', content: 'Click to add title', x: 5, y: 5, width: 90, height: 12, fontSize: 44, fontWeight: 'bold', textAlign: 'left', fontFamily: 'Inter', color: '#0f172a' },
                { id: crypto.randomUUID(), type: 'text', content: 'Column One', x: 5, y: 20, width: 42, height: 70, fontSize: 18, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Inter', color: '#1e293b' },
                { id: crypto.randomUUID(), type: 'text', content: 'Column Two', x: 52, y: 20, width: 42, height: 70, fontSize: 18, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Inter', color: '#1e293b' }
            ]
        }

        currentSlide.elements = elements
        setSlides(newSlides)
        if (elements.length > 0) setSelectedElementId(elements[0].id)
    }

    // --- Render Helpers ---
    if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Context Header */}
            <header className="flex items-center justify-between px-10 py-4 bg-white border-b border-slate-100 shrink-0 z-50 shadow-sm relative">
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${module.module_type === 'slides' ? 'bg-blue-600 shadow-blue-200' :
                        module.module_type === 'video' ? 'bg-emerald-600 shadow-emerald-200' :
                            'bg-purple-600 shadow-purple-200'
                        }`}>
                        {module.module_type === 'slides' ? <FileText className="w-5 h-5 text-white" /> :
                            module.module_type === 'video' ? <Video className="w-5 h-5 text-white" /> :
                                <HelpCircle className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{module.title}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{module.module_type === 'slides' ? 'ATCO Presentation Builder' : 'Interactive Knowledge Stream'}</p>
                    </div>
                </div>

                {/* Ribbon Tabs Selector */}
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {['master', 'insert', 'design'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveRibbonTab(tab as any)}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRibbonTab === tab ? 'bg-white text-blue-600 shadow-md shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isPreviewMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isPreviewMode ? <Play className="w-3.5 h-3.5 fill-current" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        {isPreviewMode ? 'Live Preview' : 'Student View'}
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">AI Engine Active</span>
                    </div>
                    <button
                        onClick={() => {
                            if (module.module_type === 'slides') handleSaveSlides()
                            else if (module.module_type === 'quiz') handleSaveQuiz()
                            else handleSaveVideo()
                        }}
                        disabled={saving}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Syncing...' : 'Save Academic Data'}
                    </button>
                    <button onClick={onClose} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* PowerPoint Style Ribbon Area */}
            {module.module_type === 'slides' && !isPreviewMode && (
                <div className="bg-white border-b border-slate-200 px-10 py-4 flex items-center gap-10 shrink-0 shadow-sm relative z-40">
                    {/* Master (Formatting) Group */}
                    {activeRibbonTab === 'master' && (
                        <div className="flex items-center gap-8 animate-in slide-in-from-left-4">
                            <div className="flex flex-col gap-2 border-r border-slate-100 pr-8">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Typography</span>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={slides[activeSlideIndex]?.elements.find(e => e.id === selectedElementId)?.fontFamily || 'Inter'}
                                        onChange={(e) => updateElement(selectedElementId!, { fontFamily: e.target.value })}
                                        disabled={!selectedElementId}
                                        className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 min-w-[220px] disabled:opacity-30 transition-all font-inter shadow-inner"
                                    >
                                        {[
                                            'Inter', 'Outfit', 'Roboto', 'Playfair Display', 'Caveat', 'Fira Code',
                                            'Montserrat', 'Open Sans', 'Lato', 'Poppins', 'Merriweather', 'Bebas Neue'
                                        ].map(f => (
                                            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={slides[activeSlideIndex]?.elements.find(e => e.id === selectedElementId)?.fontSize || 16}
                                        onChange={(e) => updateElement(selectedElementId!, { fontSize: parseInt(e.target.value) })}
                                        disabled={!selectedElementId}
                                        className="h-10 w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 disabled:opacity-30 shadow-inner appearance-none text-center"
                                    >
                                        {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96, 120].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 border-r border-slate-100 pr-8">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Style</span>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                                    {[
                                        { icon: <Bold className="w-4 h-4" />, attr: 'fontWeight', val: 'bold', normal: 'normal' },
                                        { icon: <Italic className="w-4 h-4" />, attr: 'fontStyle', val: 'italic', normal: 'normal' },
                                        { icon: <Underline className="w-4 h-4" />, attr: 'textDecoration', val: 'underline', normal: 'none' },
                                        { icon: <span className="font-bold border-b border-black">S</span>, attr: 'textShadow', val: '2px 2px 4px rgba(0,0,0,0.3)', normal: 'none' }
                                    ].map((btn, i) => (
                                        <button
                                            key={i}
                                            disabled={!selectedElementId}
                                            onClick={() => {
                                                const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                                updateElement(selectedElementId!, { [btn.attr]: (el as any)?.[btn.attr] === btn.val ? btn.normal : btn.val })
                                            }}
                                            className={`p-2.5 rounded-lg transition-all ${selectedElementId && (slides[activeSlideIndex].elements.find(e => e.id === selectedElementId) as any)?.[btn.attr] === btn.val ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {btn.icon}
                                        </button>
                                    ))}
                                    <div className="w-px h-6 bg-slate-200 mx-2 self-center" />
                                    <button
                                        disabled={!selectedElementId}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-transparent transition-all"
                                        style={{ backgroundColor: slides[activeSlideIndex]?.elements.find(e => e.id === selectedElementId)?.color || '#000000' }}
                                    >
                                        <div className="w-1 h-3 bg-white/30 rounded-full" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 border-r border-slate-100 pr-8">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Alignment</span>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                                    {[
                                        { icon: <AlignLeft className="w-4 h-4" />, val: 'left' },
                                        { icon: <AlignCenter className="w-4 h-4" />, val: 'center' },
                                        { icon: <AlignRight className="w-4 h-4" />, val: 'right' },
                                        { icon: <AlignJustify className="w-4 h-4" />, val: 'justify' }
                                    ].map((btn, i) => (
                                        <button
                                            key={i}
                                            disabled={!selectedElementId}
                                            onClick={() => updateElement(selectedElementId!, { textAlign: btn.val as any })}
                                            className={`p-2.5 rounded-lg transition-all ${selectedElementId && slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.textAlign === btn.val ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {btn.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pr-8">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Structure</span>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                                    <button disabled={!selectedElementId} className="p-2.5 rounded-lg text-slate-400 hover:text-slate-600"><List className="w-4 h-4" /></button>
                                    <button disabled={!selectedElementId} className="p-2.5 rounded-lg text-slate-400 hover:text-slate-600"><ListOrdered className="w-4 h-4" /></button>
                                    <button onClick={() => {
                                        const url = prompt('Enter URL:')
                                        if (url) {
                                            const text = prompt('Enter Link Text:', 'Click Here') || 'Click Here'
                                            const newEl: SlideElement = { id: crypto.randomUUID(), type: 'link', content: text, linkUrl: url, x: 20, y: 20, width: 25, height: 10, opacity: 1 }
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].elements.push(newEl)
                                            setSlides(newSlides)
                                        }
                                    }} className="flex flex-col items-center gap-1.5 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Link</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Insert Tab */}
                    {activeRibbonTab === 'insert' && (
                        <div className="flex items-center gap-8 animate-in slide-in-from-left-4">
                            <div className="flex flex-col gap-2 border-r border-slate-100 pr-8">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Elements</span>
                                <div className="flex gap-2">
                                    <button onClick={() => addElement('text')} className="flex flex-col items-center gap-1.5 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TypeIcon className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Text Box</span>
                                    </button>
                                    <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1.5 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Picture</span>
                                    </button>
                                    <button onClick={() => addElement('shape')} className="flex flex-col items-center gap-1.5 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Square className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Shape</span>
                                    </button>
                                    <button onClick={() => {
                                        const url = prompt('Enter URL:')
                                        if (url) {
                                            const text = prompt('Enter Link Text:', 'Click Here') || 'Click Here'
                                            const newEl: SlideElement = { id: crypto.randomUUID(), type: 'link', content: text, linkUrl: url, x: 20, y: 20, width: 25, height: 10, opacity: 1 }
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].elements.push(newEl)
                                            setSlides(newSlides)
                                        }
                                    }} className="flex flex-col items-center gap-1.5 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Link</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(file)
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Special</span>
                                <div className="flex gap-2 text-slate-200">
                                    <div className="flex flex-col items-center gap-1.5 p-3 opacity-30 cursor-not-allowed">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Table className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest">Table</span>
                                    </div>
                                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                        <button onClick={() => {
                                            const url = prompt('Enter Video URL (YouTube/Vimeo):')
                                            if (url) {
                                                const newEl: SlideElement = { id: crypto.randomUUID(), type: 'video', content: 'Video Element', videoUrl: url, x: 20, y: 20, width: 60, height: 40, opacity: 1 }
                                                const newSlides = [...slides]
                                                newSlides[activeSlideIndex].elements.push(newEl)
                                                setSlides(newSlides)
                                            }
                                        }} className="p-2 bg-white rounded-xl text-slate-600 hover:text-blue-600 shadow-sm border border-slate-100 flex items-center gap-2 px-3 transition-all hover:scale-105 active:scale-95">
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">URL</span>
                                        </button>
                                        <button onClick={() => videoInputRef.current?.click()} className="p-2 bg-white rounded-xl text-slate-600 hover:text-emerald-600 shadow-sm border border-slate-100 flex items-center gap-2 px-3 transition-all hover:scale-105 active:scale-95">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        className="hidden"
                                        accept="video/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleVideoUpload(file)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Design Tab */}
                    {activeRibbonTab === 'design' && (
                        <div className="flex items-center gap-8 animate-in slide-in-from-left-4">
                            <div className="flex flex-col gap-2 border-r border-slate-100 pr-8">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Structure Architecture</span>
                                <div className="flex gap-3">
                                    {[
                                        { name: 'Blank', layout: 'blank', icon: <Square className="w-4 h-4" /> },
                                        { name: 'Title Only', layout: 'title', icon: <div className="border-2 border-current w-4 h-2 rounded-[1px] opacity-60" /> },
                                        { name: 'Title Content', layout: 'title-content', icon: <div className="flex flex-col gap-0.5 w-4 h-4"><div className="h-1 bg-current rounded-[1px] w-full" /><div className="h-full bg-current rounded-[1px] w-full" /></div> },
                                        { name: 'Two Columns', layout: 'two-content', icon: <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px]" /></div> }
                                    ].map((l) => (
                                        <button
                                            key={l.name}
                                            onClick={() => applyLayout(l.layout as any)}
                                            className="flex flex-col items-center gap-1.5 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
                                        >
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{l.icon}</div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{l.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Environment Preset</span>
                                <div className="flex gap-2">
                                    {[
                                        { name: 'Pure', val: '#ffffff' },
                                        { name: 'Soft', val: '#f8fafc' },
                                        { name: 'Midnight', val: '#0f172a' },
                                        { name: 'Indigo', val: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
                                        { name: 'Emerald', val: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
                                    ].map((bg) => (
                                        <button
                                            key={bg.name}
                                            onClick={() => {
                                                const newSlides = [...slides]
                                                newSlides[activeSlideIndex].background_url = bg.val
                                                setSlides(newSlides)
                                            }}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${slides[activeSlideIndex]?.background_url === bg.val ? 'border-blue-500 scale-95 shadow-lg' : 'border-slate-100 hover:scale-105 shadow-inner'}`}
                                            style={{ background: bg.val }}
                                            title={bg.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Slide List Sidebar */}
                {!isPreviewMode && (
                    <div className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Section</span>
                            <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[7px] font-black">{slides.length}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar pb-24">
                            {slides.map((s, idx) => (
                                <div key={s.id} className="relative group flex gap-2">
                                    <div className="text-[8px] font-black text-slate-300 mt-3 w-2">{idx + 1}</div>
                                    <button
                                        onClick={() => setActiveSlideIndex(idx)}
                                        className={`flex-1 aspect-video rounded-lg border-2 transition-all p-2 flex flex-col items-center justify-center text-center relative overflow-hidden ${activeSlideIndex === idx ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="w-full h-full flex flex-col gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <div className="h-1 bg-slate-400 rounded w-2/3 mx-auto" />
                                            <div className="h-0.5 bg-slate-300 rounded w-full" />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 py-1">
                                            <span className="text-[7px] font-black uppercase tracking-tighter truncate px-1 block">{s.title || `Untitled`}</span>
                                        </div>
                                    </button>
                                    {slides.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 hover:bg-red-700"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Slide Canvas Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                    <div className="flex-1 flex items-center justify-center p-12 bg-slate-100 relative group/main">
                        {/* Toolbar Overlay */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl shadow-xl flex items-center gap-1 z-20 opacity-0 group-hover/main:opacity-100 transition-opacity">
                            <button onClick={() => addElement('text')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Add Text"><Type className="w-4 h-4" /></button>
                            <button onClick={() => addElement('image')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Add Image"><ImageIcon className="w-4 h-4" /></button>
                            <button onClick={() => addElement('shape')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Add Shape"><Square className="w-4 h-4" /></button>
                        </div>

                        <div
                            ref={canvasRef}
                            onMouseMove={(e) => {
                                if (isDragging) handleDragMove(e)
                                if (isResizing) handleResizeMove(e)
                            }}
                            onMouseUp={handleDragEnd}
                            onMouseLeave={handleDragEnd}
                            className={`aspect-video bg-white rounded-2xl relative overflow-hidden transition-all duration-500 transform origin-center ${isPreviewMode ? 'w-[90vw] max-w-[1600px] shadow-2xl' : 'w-full max-w-[1400px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]'}`}
                            style={{
                                background: slides[activeSlideIndex]?.background_url?.startsWith('linear-gradient')
                                    ? slides[activeSlideIndex].background_url
                                    : (slides[activeSlideIndex]?.background_url ? `url(${slides[activeSlideIndex].background_url})` : '#ffffff'),
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                scale: canvasScale
                            }}
                            onClick={() => setSelectedElementId(null)}
                        >
                            {slides[activeSlideIndex]?.elements.map((el) => (
                                <div
                                    key={el.id}
                                    onMouseDown={(e) => !isPreviewMode && handleDragStart(e, el.id)}
                                    onClick={(e) => { e.stopPropagation(); if (!isPreviewMode) setSelectedElementId(el.id); else if (el.type === 'link' && el.linkUrl) window.open(el.linkUrl, '_blank'); }}
                                    className={`absolute group/element shadow-none transition-all duration-300 ${selectedElementId === el.id && !isPreviewMode ? 'ring-2 ring-blue-500 rounded-lg bg-blue-500/5 shadow-lg' : ''} ${isDragging && draggedElementId === el.id ? 'opacity-50 cursor-grabbing' : (!isPreviewMode ? 'cursor-move hover:shadow-lg' : '')}`}
                                    style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`, zIndex: selectedElementId === el.id ? 10 : 1 }}
                                >
                                    {el.type === 'text' && (
                                        <div className="relative w-full h-full">
                                            {isPreviewMode ? (
                                                <div
                                                    className="w-full h-full p-4 whitespace-pre-wrap overflow-hidden"
                                                    style={{
                                                        fontSize: `${el.fontSize}px`,
                                                        textAlign: el.textAlign,
                                                        color: el.color,
                                                        fontFamily: el.fontFamily || 'Inter',
                                                        fontWeight: el.fontWeight || 'normal',
                                                        fontStyle: el.fontStyle || 'normal',
                                                        textDecoration: el.textDecoration || 'none',
                                                        textShadow: el.textShadow || 'none',
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {el.content}
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={el.content}
                                                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                                    className={`w-full h-full bg-transparent border-none focus:ring-0 p-4 resize-none text-slate-900 transition-all ${el.content.startsWith('Click to add') ? 'opacity-40 italic' : 'opacity-100'}`}
                                                    style={{
                                                        fontSize: `${el.fontSize}px`,
                                                        textAlign: el.textAlign,
                                                        color: el.color,
                                                        fontFamily: el.fontFamily || 'Inter',
                                                        fontWeight: el.fontWeight || 'normal',
                                                        fontStyle: el.fontStyle || 'normal',
                                                        textDecoration: el.textDecoration || 'none',
                                                        textShadow: el.textShadow || 'none',
                                                        lineHeight: 1.2
                                                    }}
                                                />
                                            )}
                                            {/* PowerPoint Style Guide Lines */}
                                            {selectedElementId !== el.id && !isPreviewMode && (
                                                <div className="absolute inset-0 border border-dashed border-slate-200 pointer-events-none rounded opacity-0 group-hover/element:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    )}
                                    {el.type === 'image' && (
                                        <img src={el.content} className="w-full h-full object-cover rounded-lg" />
                                    )}
                                    {el.type === 'video' && (
                                        <div className="w-full h-full bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center group/video">
                                            {el.videoUrl?.includes('youtube.com') || el.videoUrl?.includes('youtu.be') || el.videoUrl?.includes('vimeo.com') ? (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                                    <Play className="w-12 h-12 text-white/20 group-hover/video:text-white/50 transition-colors" />
                                                    <span className="absolute bottom-2 left-2 text-[6px] text-white/40 uppercase tracking-widest truncate max-w-full px-2">{el.videoUrl}</span>
                                                </div>
                                            ) : (
                                                <video
                                                    src={el.videoUrl}
                                                    controls={isPreviewMode}
                                                    className="w-full h-full object-contain"
                                                    poster="https://via.placeholder.com/800x450/000000/FFFFFF?text=Local+Video+Ready"
                                                />
                                            )}
                                            {!isPreviewMode && (
                                                <div className="absolute inset-0 bg-transparent z-10" />
                                            )}
                                        </div>
                                    )}
                                    {el.type === 'link' && (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{el.content}</span>
                                        </div>
                                    )}
                                    {el.type === 'shape' && (
                                        <div className="w-full h-full rounded-lg" style={{ backgroundColor: el.color }} />
                                    )}

                                    {/* Resize handle */}
                                    {selectedElementId === el.id && !isPreviewMode && (
                                        <button
                                            onMouseDown={(e) => handleResizeStart(e, el.id)}
                                            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl-lg shadow-lg flex items-center justify-center cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                                        >
                                            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-white opacity-80" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Control Bar & Notes Area */}
                    <div className="mt-8 flex flex-col gap-6 px-12 pb-12 overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4 bg-white px-6 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                                    <button disabled={activeSlideIndex === 0} onClick={() => setActiveSlideIndex(prev => prev - 1)} className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[100px] text-center">Slide {activeSlideIndex + 1} / {slides.length}</span>
                                    <button disabled={activeSlideIndex === slides.length - 1} onClick={() => setActiveSlideIndex(prev => prev + 1)} className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                </div>

                                <div className="flex items-center gap-4 bg-white px-6 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                                    <button onClick={() => setCanvasScale(prev => Math.max(0.1, prev - 0.1))} className="p-1 text-slate-400 hover:text-blue-600"><X className="w-4 h-4 rotate-45" /></button>
                                    <span className="text-[9px] font-black text-slate-900 w-12 text-center">{Math.round(canvasScale * 100)}%</span>
                                    <button onClick={() => setCanvasScale(prev => Math.min(2, prev + 0.1))} className="p-1 text-slate-400 hover:text-blue-600"><Plus className="w-4 h-4" /></button>
                                    <button onClick={() => setCanvasScale(0.8)} className="ml-2 text-[8px] font-black text-blue-600 uppercase tracking-widest">Fit</button>
                                </div>
                            </div>

                            <button
                                onClick={addNewSlide}
                                className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-100"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Slide
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-slate-400">
                                <FileText className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Presenter Notes / Context</span>
                            </div>
                            <textarea
                                value={slides[activeSlideIndex]?.notes || ''}
                                onChange={(e) => {
                                    const newSlides = [...slides]
                                    newSlides[activeSlideIndex].notes = e.target.value
                                    setSlides(newSlides)
                                }}
                                className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-medium text-slate-600 focus:ring-0 min-h-[100px] resize-none placeholder:text-slate-300 italic"
                                placeholder="Add notes for the ATCO or context for the AI engine..."
                            />
                        </div>
                    </div>
                </div>

                {/* Properties Panel */}
                {!isPreviewMode && (
                    <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto no-scrollbar">
                        <div className="space-y-8">
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Properties</h4>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Stage Title</label>
                                    <input
                                        value={slides[activeSlideIndex]?.title || ''}
                                        onChange={(e) => {
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].title = e.target.value
                                            setSlides(newSlides)
                                        }}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner"
                                        placeholder="Slide Title..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Architecture Design</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { name: 'Pure', val: '#ffffff' },
                                            { name: 'Soft', val: '#f8fafc' },
                                            { name: 'Sky', val: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
                                            { name: 'Dream', val: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' },
                                            { name: 'Ocean', val: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' },
                                            { name: 'Midnight', val: '#0f172a' },
                                            { name: 'Indigo', val: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
                                            { name: 'Emerald', val: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
                                        ].map((bg) => (
                                            <button
                                                key={bg.name}
                                                onClick={() => {
                                                    const newSlides = [...slides]
                                                    newSlides[activeSlideIndex].background_url = bg.val
                                                    setSlides(newSlides)
                                                }}
                                                className={`aspect-square rounded-lg border-2 transition-all ${slides[activeSlideIndex]?.background_url === bg.val ? 'border-blue-500 scale-95 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                                style={{ background: bg.val }}
                                                title={bg.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {selectedElementId && (
                                <section className="space-y-6 pt-6 border-t border-slate-100 animate-in slide-in-from-right-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Text Formatting</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => {
                                            const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                            updateElement(selectedElementId, { fontWeight: el?.fontWeight === 'bold' ? 'normal' : 'bold' })
                                        }} className="py-2 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest"><Bold className="w-3.5 h-3.5 mx-auto" /></button>
                                        <button onClick={() => {
                                            const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                            updateElement(selectedElementId, { fontStyle: el?.fontStyle === 'italic' ? 'normal' : 'italic' })
                                        }} className="py-2 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest"><Italic className="w-3.5 h-3.5 mx-auto" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Typography</label>
                                        <select
                                            value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontFamily || 'Inter'}
                                            onChange={(e) => updateElement(selectedElementId, { fontFamily: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner appearance-none"
                                        >
                                            {['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'Caveat', 'Fira Code'].map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Vessel Size</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="8"
                                                        max="120"
                                                        value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize || 16}
                                                        onChange={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                                        className="flex-1 accent-blue-600"
                                                    />
                                                    <span className="text-[10px] font-black text-slate-900 w-8">{slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize || 16}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Ink Palette</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['#0f172a', '#2563eb', '#059669', '#dc2626', '#ffffff', '#94a3b8', '#f59e0b', '#7c3aed'].map(c => (
                                                <button key={c} onClick={() => updateElement(selectedElementId, { color: c })} className={`w-7 h-7 rounded-full border-2 transition-all ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.color === c ? 'border-blue-500 scale-110 shadow-md' : 'border-slate-200 hover:scale-105'}`} style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}

                {module.module_type === 'video' && (
                    <div className="flex-1 p-12 overflow-y-auto no-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm space-y-8">
                                <div className="flex items-center gap-4 text-emerald-600">
                                    <Video className="w-6 h-6" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Video Stream Configuration</h4>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <button className="p-8 border-2 border-slate-100 bg-slate-50 rounded-[2rem] text-center space-y-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto"><Play className="w-6 h-6" /></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">External URL</p>
                                        </button>
                                        <button className="p-8 border-2 border-slate-100 bg-slate-50 rounded-[2rem] text-center space-y-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto"><ImageIcon className="w-6 h-6" /></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Upload Source</p>
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stream Destination</label>
                                        <input
                                            value={module.video_url || ''}
                                            onChange={(e) => onChange({ ...module, video_url: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner"
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {
                    module.module_type === 'quiz' && (
                        <div className="flex-1 flex overflow-hidden">
                            {/* Question List Sidebar */}
                            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                                <div className="p-4 border-b border-slate-100">
                                    <button
                                        onClick={() => {
                                            setQuestions([...questions, { text: '', type: 'multiple_choice', options: ['', ''], correctAnswers: [], timing: 'final' }])
                                            setActiveQuestionIndex(questions.length)
                                        }}
                                        className="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Question
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {questions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveQuestionIndex(idx)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex flex-col gap-1 text-left ${activeQuestionIndex === idx ? 'border-purple-500 bg-purple-50' : 'border-slate-50 bg-slate-50 hover:border-slate-100'}`}
                                        >
                                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${activeQuestionIndex === idx ? 'text-purple-600' : 'text-slate-400'}`}>Question {idx + 1}</span>
                                            <span className="text-[10px] font-black text-slate-900 line-clamp-2 uppercase tracking-tight">{q.text || 'Untitled Question'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Editor Area */}
                            <div className="flex-1 p-12 overflow-y-auto no-scrollbar bg-white">
                                <div className="max-w-3xl mx-auto space-y-12">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inquiry Definition</label>
                                        <textarea
                                            value={questions[activeQuestionIndex]?.text}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { text: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-2xl font-black text-slate-900 outline-none focus:border-purple-500 shadow-inner"
                                            placeholder="What is the primary objective of...?"
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Configuration</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {(['multiple_choice', 'multiple_selection', 'written'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => updateQuestion(activeQuestionIndex, { type })}
                                                    className={`p-6 border-2 rounded-2xl text-center flex flex-col items-center gap-3 transition-all ${questions[activeQuestionIndex]?.type === type ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${questions[activeQuestionIndex]?.type === type ? 'bg-purple-600 text-white' : 'bg-slate-200'}`}>
                                                        {type === 'multiple_choice' ? <CheckCircle2 className="w-5 h-5" /> : type === 'written' ? <FileText className="w-5 h-5" /> : <List className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{type.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}

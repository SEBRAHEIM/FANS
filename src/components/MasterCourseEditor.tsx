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
    Layout,
    LayoutDashboard,
    Copy
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const FONT_LIBRARY = [
    { name: 'Inter', family: 'Inter, system-ui, sans-serif' },
    { name: 'Calibri', family: '"Calibri", "Segoe UI", Candara, Segoe, Optima, Arial, sans-serif' },
    { name: 'Arial', family: 'Arial, "Helvetica Neue", Helvetica, sans-serif' },
    { name: 'Times New Roman', family: '"Times New Roman", Times, Baskerville, Georgia, serif' },
    { name: 'Helvetica', family: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
    { name: 'Georgia', family: 'Georgia, Times, "Times New Roman", serif' },
    { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
    { name: 'Trebuchet MS', family: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif' },
    { name: 'Impact', family: 'Impact, Haettenschweiler, "Franklin Gothic Bold", Charcoal, "Helvetica Inserat", "Bitstream Vera Sans Bold", "Arial Black", sans-serif' },
    { name: 'Comic Sans MS', family: '"Comic Sans MS", "Comic Sans", cursive' },
    { name: 'Tahoma', family: 'Tahoma, Verdana, Segoe, sans-serif' },
    { name: 'Courier New', family: '"Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace' },
    { name: 'Garamond', family: 'Garamond, Baskerville, "Baskerville Old Face", "Hoefler Text", "Times New Roman", serif' },
    { name: 'Book Antiqua', family: '"Book Antiqua", Palatino, "Palatino Linotype", "Palatino LT STD", Georgia, serif' },
    { name: 'Century Gothic', family: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif' },
    { name: 'Franklin Gothic Medium', family: '"Franklin Gothic Medium", "Franklin Gothic", "ITC Franklin Gothic", sans-serif' },
    { name: 'Segoe UI', family: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    { name: 'Consolas', family: 'Consolas, monaco, monospace' },
    { name: 'Outfit', family: 'Outfit, sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Bebas Neue', family: '"Bebas Neue", cursive' },
    { name: 'Merriweather', family: 'Merriweather, serif' },
    { name: 'Caveat', family: 'Caveat, cursive' },
    { name: 'Fira Code', family: '"Fira Code", monospace' }
]

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
        module_type: 'slides' | 'video' | 'quiz' | 'document'
        video_url?: string
        video_source?: 'youtube' | 'vimeo' | 'storage'
        is_unskippable?: boolean
        description?: string
        content?: any
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
    const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null)
    const [canvasScale, setCanvasScale] = useState(0.8)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
    const [saving, setSaving] = useState(false)
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

            // Delete element logic
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
                // Check if we are inside a textarea
                const activeElement = document.activeElement;
                const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

                // If it's a textarea, only delete if the user isn't typing there, 
                // but that's hard to detect perfectly. 
                // Better approach: only delete if the text is NOT focused or if we handle specific logic.
                // For now, let's allow it if it's not an input, or if it's the element itself.
                if (!isInput) {
                    deleteElement(selectedElementId);
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [slides.length, selectedElementId])

    // Safety net for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isDirty])

    // Auto-save logic
    useEffect(() => {
        if (!isDirty || loading || saving || isDragging || isResizing) return

        const timer = setTimeout(() => {
            const runner = async () => {
                if (module.module_type === 'slides') handleSaveSlides(true)
                else if (module.module_type === 'quiz') handleSaveQuiz(true)
                else if (module.module_type === 'document') handleSaveDocument(true)
                else handleSaveVideo(true)
                setIsDirty(false)
                setLastSavedAt(new Date())
            }
            runner()
        }, 3000)

        return () => clearTimeout(timer)
    }, [isDirty, loading, saving, isDragging, isResizing])

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
        } else if (module.module_type === 'document') {
            // Document content is typically already in the module object passed as prop,
            // but we can ensure local state is synced if needed.
        }
        setLoading(false)
    }

    // --- Persistence Handlers ---
    async function handleSaveSlides(isAutoSave = false) {
        if (!isAutoSave) setSaving(true)
        const updates = slides.map((s, idx) => {
            const update: any = {
                module_id: module.id,
                title: s.title,
                background_url: s.background_url,
                content_json: { elements: s.elements },
                order_index: idx
            }
            // Only include ID if it's not a temporary one (UUID with hyphens from client)
            if (!s.id.includes('new-') && !s.id.includes(crypto.randomUUID().split('-')[0])) {
                // This logic is a bit brittle, better check if it's a real DB UUID vs our local one
                // Actually, our local IDs for NEW slides start with 'new-' or are just randomUUIDs
                if (!s.id.startsWith('new-') && s.id.length > 20) {
                    update.id = s.id
                }
            }
            return update
        })

        const { error } = await supabase
            .from('module_slides')
            .upsert(updates)

        if (error) {
            if (!isAutoSave) alert('Error saving slides: ' + error.message)
            else console.error('Silent Sync Error:', error.message)
        } else {
            onChange({ ...module, slides })
            if (!isAutoSave) fetchModuleContent() // Only refresh full content on manual save
        }
        if (!isAutoSave) setSaving(false)
    }

    async function handleSaveQuiz(isAutoSave = false) {
        if (!isAutoSave) setSaving(true)
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
            if (!isAutoSave) alert('Error saving quiz: ' + error.message)
        } else {
            onChange({ ...module, questions })
        }
        if (!isAutoSave) setSaving(false)
    }

    async function handleSaveVideo(isAutoSave = false) {
        if (!isAutoSave) setSaving(true)
        const { error } = await supabase
            .from('modules')
            .update({
                video_url: module.video_url,
                video_source: module.video_source,
                is_unskippable: module.is_unskippable
            })
            .eq('id', module.id)

        if (error) {
            if (!isAutoSave) alert('Error saving video settings: ' + error.message)
        } else {
            onChange(module)
        }
        if (!isAutoSave) setSaving(false)
    }

    async function handleSaveDocument(isAutoSave = false) {
        if (!isAutoSave) setSaving(true)
        const { error } = await supabase
            .from('modules')
            .update({
                description: module.description,
                content: module.content // Stores JSON or rich text structure
            })
            .eq('id', module.id)

        if (error) {
            if (!isAutoSave) alert('Error saving documentation: ' + error.message)
        } else {
            onChange(module)
        }
        if (!isAutoSave) setSaving(false)
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
        setIsDirty(true)
    }

    const deleteElement = (id: string) => {
        const newSlides = [...slides]
        newSlides[activeSlideIndex].elements = newSlides[activeSlideIndex].elements.filter(e => e.id !== id)
        setSlides(newSlides)
        setSelectedElementId(null)
        setIsDirty(true)
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
        setIsDirty(true)
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
        setIsDirty(true)
    }

    const deleteSlide = (index: number) => {
        if (slides.length <= 1) return
        const newSlides = slides.filter((_, i) => i !== index)
        setSlides(newSlides)
        if (activeSlideIndex >= newSlides.length) {
            setActiveSlideIndex(Math.max(0, newSlides.length - 1))
        }
        setIsDirty(true)
    }

    const duplicateSlide = (index: number) => {
        const slideToDuplicate = slides[index]
        const newSlide: Slide = {
            ...slideToDuplicate,
            id: `new-${crypto.randomUUID()}`,
            order_index: index + 1,
            elements: slideToDuplicate.elements.map(el => ({ ...el, id: crypto.randomUUID() }))
        }

        const newSlides = [...slides]
        newSlides.splice(index + 1, 0, newSlide)

        // Update order indices for all following slides
        const reorderedSlides = newSlides.map((s, i) => ({ ...s, order_index: i }))

        setSlides(reorderedSlides)
        setActiveSlideIndex(index + 1)
        setIsDirty(true)
    }

    const handleSlideDragStart = (e: React.DragEvent, index: number) => {
        setDraggedSlideIndex(index)
        e.dataTransfer.setData('text/plain', index.toString())
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleSlideDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleSlideDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault()
        if (draggedSlideIndex === null || draggedSlideIndex === dropIndex) return

        const newSlides = [...slides]
        const [movedSlide] = newSlides.splice(draggedSlideIndex, 1)
        newSlides.splice(dropIndex, 0, movedSlide)

        // Update order indices
        const reorderedSlides = newSlides.map((s, i) => ({ ...s, order_index: i }))

        setSlides(reorderedSlides)
        setActiveSlideIndex(dropIndex)
        setDraggedSlideIndex(null)
        setIsDirty(true)
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
        setIsDirty(true)
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
        setIsDirty(true)
    }

    // --- Quiz Handlers ---
    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], ...updates }
        setQuestions(newQuestions)
        setIsDirty(true)
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
        setIsDirty(true)
    }

    const resetNewSlideIds = (sArray: Slide[]) => {
        return sArray.map(s => {
            if (s.id.length < 20 || !s.id.includes('-')) {
                return { ...s, id: `new-${crypto.randomUUID()}` }
            }
            return s
        })
    }

    // --- Render Helpers ---
    if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#7BB8E0] border-t-transparent rounded-full animate-spin" /></div>

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50 overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Outfit:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Playfair+Display:wght@400;700;900&family=Poppins:wght@400;700;900&family=Bebas+Neue&family=Merriweather:wght@400;700&family=Caveat:wght@400;700&family=Fira+Code:wght@400;700&display=swap');
            `}} />
            {/* Context Header */}
            <header className="flex items-center justify-between px-10 py-4 bg-white border-b border-slate-100 shrink-0 z-50 shadow-sm relative">
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${module.module_type === 'slides' ? 'bg-[#7BB8E0] shadow-blue-200' :
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
                {module.module_type === 'slides' && (
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {['master', 'insert', 'design'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveRibbonTab(tab as any)}
                                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRibbonTab === tab ? 'bg-white text-[#7BB8E0] shadow-md shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isPreviewMode ? 'bg-[#7BB8E0] text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        <Maximize2 className="w-4 h-4" />
                        {isPreviewMode ? 'Exit Preview' : 'Student View'}
                    </button>

                    <button
                        disabled={saving}
                        onClick={async () => {
                            if (module.module_type === 'slides') await handleSaveSlides()
                            else if (module.module_type === 'quiz') await handleSaveQuiz()
                            else if (module.module_type === 'document') await handleSaveDocument()
                            else await handleSaveVideo()
                        }}
                        className={`relative px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] ${saving ? 'bg-slate-100 text-slate-400' : 'bg-[#7BB8E0] text-white shadow-blue-500/20 hover:bg-blue-700'}`}
                    >
                        {saving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                <span>Syncing...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Academic Data</span>
                            </>
                        )}
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
                                        className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 min-w-[220px] disabled:opacity-30 transition-all shadow-inner"
                                        style={{ fontFamily: slides[activeSlideIndex]?.elements.find(e => e.id === selectedElementId)?.fontFamily || 'Inter' }}
                                    >
                                        {FONT_LIBRARY.map(f => (
                                            <option key={f.name} value={f.family} style={{ fontFamily: f.family }}>{f.name}</option>
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
                                            className={`p-2.5 rounded-lg transition-all border ${selectedElementId && (slides[activeSlideIndex].elements.find(e => e.id === selectedElementId) as any)?.[btn.attr] === btn.val ? 'bg-[#7BB8E0] text-white border-blue-700 shadow-md scale-105' : 'bg-white text-slate-500 hover:text-slate-700 border-slate-200 shadow-sm'}`}
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
                                            className={`p-2.5 rounded-lg transition-all ${selectedElementId && slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.textAlign === btn.val ? 'bg-white text-[#7BB8E0] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                                        <div className="w-10 h-10 bg-blue-50 text-[#7BB8E0] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 className="w-5 h-5" /></div>
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
                                        <div className="w-10 h-10 bg-blue-50 text-[#7BB8E0] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TypeIcon className="w-5 h-5" /></div>
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
                                        <div className="w-10 h-10 bg-blue-50 text-[#7BB8E0] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 className="w-5 h-5" /></div>
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
                                        }} className="p-2 bg-white rounded-xl text-slate-600 hover:text-[#7BB8E0] shadow-sm border border-slate-100 flex items-center gap-2 px-3 transition-all hover:scale-105 active:scale-95">
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
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${slides[activeSlideIndex]?.background_url === bg.val ? 'border-[#7BB8E0] scale-95 shadow-lg' : 'border-slate-100 hover:scale-105 shadow-inner'}`}
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
                {module.module_type === 'slides' && (
                    <>
                        {/* Slide List Sidebar */}
                        {!isPreviewMode && (
                            <div className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
                                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Section</span>
                                    <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[7px] font-black">{slides.length}</div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar pb-24">
                                    {slides.map((s, idx) => (
                                        <div
                                            key={s.id}
                                            className={`relative group flex gap-2 transition-all ${draggedSlideIndex === idx ? 'opacity-30' : 'opacity-100'}`}
                                            draggable={!isPreviewMode}
                                            onDragStart={(e) => handleSlideDragStart(e, idx)}
                                            onDragOver={(e) => handleSlideDragOver(e, idx)}
                                            onDrop={(e) => handleSlideDrop(e, idx)}
                                        >
                                            <div className="text-[8px] font-black text-slate-300 mt-3 w-2">{idx + 1}</div>
                                            <button
                                                onClick={() => setActiveSlideIndex(idx)}
                                                className={`flex-1 aspect-video rounded-lg border-2 transition-all p-2 flex flex-col items-center justify-center text-center relative overflow-hidden ${activeSlideIndex === idx ? 'border-[#7BB8E0] bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
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
                                                    title="Delete Slide"
                                                >
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#7BB8E0] text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 hover:bg-blue-700"
                                                title="Duplicate Slide"
                                            >
                                                <Copy className="w-2.5 h-2.5" />
                                            </button>
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
                                                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#7BB8E0] rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{el.content}</span>
                                                </div>
                                            )}
                                            {el.type === 'shape' && (
                                                <div className="w-full h-full rounded-lg" style={{ backgroundColor: el.color }} />
                                            )}

                                            {/* Resize handle */}
                                            {/* PowerPoint Style Resize Handles */}
                                            {selectedElementId === el.id && !isPreviewMode && (
                                                <>
                                                    {/* Floating Delete Button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                                                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white p-1.5 rounded-lg shadow-xl hover:bg-red-700 transition-all z-[60] flex items-center gap-1.5"
                                                        title="Delete Element"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-1">Remove</span>
                                                    </button>

                                                    {/* Corner Handles */}
                                                    <div onMouseDown={(e) => handleResizeStart(e, el.id)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7BB8E0] rounded-full shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform" />
                                                    <div onMouseDown={(e) => handleResizeStart(e, el.id)} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7BB8E0] rounded-full shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform" />
                                                    <div onMouseDown={(e) => handleResizeStart(e, el.id)} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7BB8E0] rounded-full shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform" />
                                                    <div onMouseDown={(e) => handleResizeStart(e, el.id)} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7BB8E0] rounded-full shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform" />
                                                </>
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
                                            <button disabled={activeSlideIndex === 0} onClick={() => setActiveSlideIndex(prev => prev - 1)} className="p-1.5 text-slate-400 hover:text-[#7BB8E0] disabled:opacity-20 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[100px] text-center">Slide {slides.length > 0 ? activeSlideIndex + 1 : 0} / {slides.length}</span>
                                            <button disabled={activeSlideIndex === slides.length - 1} onClick={() => setActiveSlideIndex(prev => prev + 1)} className="p-1.5 text-slate-400 hover:text-[#7BB8E0] disabled:opacity-20 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                        </div>

                                        <div className="flex items-center gap-4 bg-white px-6 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                                            <button onClick={() => setCanvasScale(prev => Math.max(0.1, prev - 0.1))} className="p-1 text-slate-400 hover:text-[#7BB8E0]"><X className="w-4 h-4 rotate-45" /></button>
                                            <span className="text-[9px] font-black text-slate-900 w-12 text-center">{Math.round(canvasScale * 100)}%</span>
                                            <button onClick={() => setCanvasScale(prev => Math.min(2, prev + 0.1))} className="p-1 text-slate-400 hover:text-[#7BB8E0]"><Plus className="w-4 h-4" /></button>
                                            <button onClick={() => setCanvasScale(0.8)} className="ml-2 text-[8px] font-black text-[#7BB8E0] uppercase tracking-widest">Fit</button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={addNewSlide}
                                        className="px-6 py-2.5 bg-blue-50 text-[#7BB8E0] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-100"
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
                                            setIsDirty(true)
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
                                                    setIsDirty(true)
                                                }}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#7BB8E0] shadow-inner"
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
                                                            setIsDirty(true)
                                                        }}
                                                        className={`aspect-square rounded-lg border-2 transition-all ${slides[activeSlideIndex]?.background_url === bg.val ? 'border-[#7BB8E0] scale-95 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                                        style={{ background: bg.val }}
                                                        title={bg.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {selectedElementId && (
                                        <section className="space-y-6 pt-6 border-t border-slate-100 animate-in slide-in-from-right-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#7BB8E0]">Text Formatting</h4>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Text Formatting</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { icon: <Bold className="w-4 h-4" />, attr: 'fontWeight', val: 'bold', normal: 'normal' },
                                                        { icon: <Italic className="w-4 h-4" />, attr: 'fontStyle', val: 'italic', normal: 'normal' },
                                                        { icon: <Underline className="w-4 h-4" />, attr: 'textDecoration', val: 'underline', normal: 'none' },
                                                        { icon: <span className="font-bold border-b border-black">S</span>, attr: 'textShadow', val: '2px 2px 4px rgba(0,0,0,0.3)', normal: 'none' }
                                                    ].map((btn, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                                                updateElement(selectedElementId!, { [btn.attr]: (el as any)?.[btn.attr] === btn.val ? btn.normal : btn.val })
                                                            }}
                                                            className={`py-3 rounded-2xl transition-all border flex items-center justify-center ${selectedElementId && (slides[activeSlideIndex].elements.find(e => e.id === selectedElementId) as any)?.[btn.attr] === btn.val ? 'bg-[#7BB8E0] text-white border-blue-700 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'}`}
                                                        >
                                                            {btn.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Typography</label>
                                                <div className="space-y-3">
                                                    <select
                                                        value={slides[activeSlideIndex]?.elements.find(e => e.id === selectedElementId)?.fontFamily || 'Inter'}
                                                        onChange={(e) => updateElement(selectedElementId!, { fontFamily: e.target.value })}
                                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-900 focus:border-[#7BB8E0] outline-none transition-all shadow-inner"
                                                        style={{ fontFamily: slides[activeSlideIndex]?.elements.find(e => e.id === selectedElementId)?.fontFamily || 'Inter' }}
                                                    >
                                                        {FONT_LIBRARY.map(f => (
                                                            <option key={f.name} value={f.family} style={{ fontFamily: f.family }}>{f.name}</option>
                                                        ))}
                                                    </select>

                                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                                                        <input
                                                            type="range"
                                                            min="8"
                                                            max="120"
                                                            value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize || 16}
                                                            onChange={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                                            className="flex-1 accent-blue-600 h-1"
                                                        />
                                                        <span className="text-xs font-black text-slate-900 w-10 text-center">{slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize || 16}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Ink Palette</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['#0f172a', '#2563eb', '#059669', '#dc2626', '#ffffff', '#94a3b8', '#f59e0b', '#7c3aed'].map(c => (
                                                        <button key={c} onClick={() => updateElement(selectedElementId, { color: c })} className={`w-7 h-7 rounded-full border-2 transition-all ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.color === c ? 'border-[#7BB8E0] scale-110 shadow-md' : 'border-slate-200 hover:scale-105'}`} style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100">
                                                <button
                                                    onClick={() => deleteElement(selectedElementId)}
                                                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-3 border border-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete Element
                                                </button>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {module.module_type === 'video' && (
                    <div className="flex-1 flex items-center justify-center p-12 bg-slate-50 overflow-y-auto no-scrollbar">
                        <div className="w-full max-w-4xl space-y-12 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] space-y-10">
                                <header className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                                        <Video className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 font-outfit">Video Stream configuration</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">High-Definition Source Management</p>
                                    </div>
                                </header>
                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        {[
                                            { id: 'youtube', label: 'External Stream', sub: 'YouTube / Vimeo / URL', icon: <Play className="w-7 h-7" /> },
                                            { id: 'storage', label: 'Local Source', sub: 'Secure Cloud Upload', icon: <ImageIcon className="w-7 h-7" /> }
                                        ].map((source) => (
                                            <button
                                                key={source.id}
                                                onClick={() => {
                                                    onChange({ ...module, video_source: source.id })
                                                    setIsDirty(true)
                                                }}
                                                className={`p-10 border-2 rounded-[2.5rem] text-left space-y-5 transition-all duration-300 group ${module.video_source === source.id ? 'border-emerald-500 bg-emerald-50/50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${module.video_source === source.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 group-hover:scale-110 shadow-sm'}`}>
                                                    {source.icon}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight text-slate-900 font-outfit">{source.label}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{source.sub}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Stream Destination URL</label>
                                            {module.video_url && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid Link</span>}
                                        </div>
                                        <div className="relative group">
                                            <input
                                                value={module.video_url || ''}
                                                onChange={(e) => {
                                                    onChange({ ...module, video_url: e.target.value })
                                                    setIsDirty(true)
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-base font-bold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 focus:bg-white outline-none transition-all shadow-inner pl-14"
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                            <Play className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] transition-all hover:bg-white overflow-hidden relative group">
                                        <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                                        <div className="pl-2">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight font-outfit">Strict Progress Enforcement</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">ATCOs cannot skip or fast-forward this video</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange({ ...module, is_unskippable: !module.is_unskippable })
                                                setIsDirty(true)
                                            }}
                                            className={`w-16 h-8 rounded-full transition-all relative ${module.is_unskippable ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${module.is_unskippable ? 'left-9' : 'left-1.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {module.module_type === 'quiz' && (
                    <div className="flex-1 flex overflow-hidden bg-white">
                        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 relative z-30">
                            <div className="p-6 border-b border-slate-200 bg-white">
                                <button
                                    onClick={() => {
                                        setQuestions([...questions, { text: '', type: 'multiple_choice', options: ['', ''], correctAnswers: [], timing: 'final' }])
                                        setActiveQuestionIndex(questions.length)
                                    }}
                                    className="w-full py-4 bg-[#7BB8E0] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Question
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-24">
                                {questions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveQuestionIndex(idx)}
                                        className={`w-full p-5 rounded-[2rem] border-2 transition-all group relative ${activeQuestionIndex === idx ? 'border-[#7BB8E0] bg-white shadow-xl' : 'border-transparent bg-slate-100/50 hover:bg-white hover:border-slate-200'}`}
                                    >
                                        <div className="flex flex-col gap-2 text-left">
                                            <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${activeQuestionIndex === idx ? 'text-[#7BB8E0]' : 'text-slate-400'}`}>Inquiry {idx + 1}</span>
                                            <span className="text-[10px] font-black text-slate-800 line-clamp-2 uppercase tracking-tight leading-relaxed">{q.text || 'Untitled Question'}</span>
                                        </div>
                                        {activeQuestionIndex === idx && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#7BB8E0] rounded-full shadow-[0_0_12px_rgba(123,184,224,0.8)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 p-16 overflow-y-auto no-scrollbar bg-white relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(123,184,224,0.05),transparent_50%)] pointer-events-none" />
                            <div className="max-w-4xl mx-auto space-y-16 relative z-10">
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Question Definition</label>
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#7BB8E0] opacity-20" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#7BB8E0] opacity-40" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#7BB8E0]" />
                                        </div>
                                    </div>
                                    <textarea
                                        value={questions[activeQuestionIndex]?.text}
                                        onChange={(e) => updateQuestion(activeQuestionIndex, { text: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-12 text-3xl font-black text-slate-900 outline-none focus:border-[#7BB8E0] focus:bg-white shadow-[inner_0_4px_12px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-200"
                                        placeholder="Formulate the assessment inquiry here..."
                                    />
                                </section>
                                <section className="space-y-10">
                                    <header className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                        <LayoutDashboard className="w-5 h-5 text-[#7BB8E0]" />
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Response Logic configuration</h5>
                                    </header>
                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { id: 'multiple_choice', label: 'Single Choice', icon: <CheckCircle2 className="w-6 h-6" /> },
                                            { id: 'multiple_selection', label: 'Multi Select', icon: <List className="w-6 h-6" /> },
                                            { id: 'written', label: 'Written Response', icon: <FileText className="w-6 h-6" /> }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => updateQuestion(activeQuestionIndex, { type: t.id as any })}
                                                className={`p-8 border-2 rounded-[2.5rem] flex flex-col items-center gap-5 transition-all duration-500 group ${questions[activeQuestionIndex]?.type === t.id ? 'border-[#7BB8E0] bg-blue-50/50 shadow-xl' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${questions[activeQuestionIndex]?.type === t.id ? 'bg-[#7BB8E0] text-white shadow-lg' : 'bg-white text-slate-300 group-hover:scale-110 shadow-inner'}`}>
                                                    {t.icon}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${questions[activeQuestionIndex]?.type === t.id ? 'text-[#7BB8E0]' : 'text-slate-400'}`}>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                {questions[activeQuestionIndex]?.type !== 'written' && (
                                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between px-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Option Architecture</label>
                                            <button
                                                onClick={() => {
                                                    const q = questions[activeQuestionIndex]
                                                    updateQuestion(activeQuestionIndex, { options: [...q.options, 'New Option'] })
                                                }}
                                                className="text-[9px] font-black text-[#7BB8E0] uppercase tracking-widest hover:text-blue-700 transition-colors"
                                            >
                                                + Append Response
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {questions[activeQuestionIndex]?.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-4 group">
                                                    <button
                                                        onClick={() => {
                                                            const q = questions[activeQuestionIndex]
                                                            let news = [...q.correctAnswers]
                                                            if (q.type === 'multiple_choice') news = [opt]
                                                            else {
                                                                if (news.includes(opt)) news = news.filter(n => n !== opt)
                                                                else news.push(opt)
                                                            }
                                                            updateQuestion(activeQuestionIndex, { correctAnswers: news })
                                                        }}
                                                        className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border-2 transition-all ${questions[activeQuestionIndex].correctAnswers.includes(opt) ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-emerald-200'}`}
                                                    >
                                                        {questions[activeQuestionIndex].correctAnswers.includes(opt) ? <CheckCircle2 className="w-5 h-5 shadow-sm" /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                                                    </button>
                                                    <input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const q = questions[activeQuestionIndex]
                                                            const newOpts = [...q.options]
                                                            newOpts[oIdx] = e.target.value
                                                            updateQuestion(activeQuestionIndex, { options: newOpts })
                                                        }}
                                                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#7BB8E0] focus:bg-white transition-all shadow-inner"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const q = questions[activeQuestionIndex]
                                                            updateQuestion(activeQuestionIndex, { options: q.options.filter((_, i) => i !== oIdx) })
                                                        }}
                                                        className="p-3 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {module.module_type === 'document' && (
                    <div className="flex-1 p-12 overflow-y-auto no-scrollbar bg-[#f8fafc]">
                        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <header className="bg-white border border-slate-200/60 p-10 rounded-[3rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex items-center justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-100/50 transition-colors" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center shadow-inner">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 font-outfit">Module Documentation</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Rich Technical Guides & Operating Procedures</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 relative z-10">
                                    <button className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        Import MD
                                    </button>
                                </div>
                            </header>
                            <div className="bg-white border border-slate-200/50 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Technical Content Editor</span>
                                    <div className="flex gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                    </div>
                                </div>
                                <div className="p-10 space-y-6">
                                    <textarea
                                        value={module.description || ''}
                                        onChange={(e) => {
                                            onChange({ ...module, description: e.target.value })
                                            setIsDirty(true)
                                        }}
                                        className="w-full bg-transparent border-none rounded-none p-4 text-lg font-medium text-slate-700 focus:ring-0 outline-none transition-all min-h-[700px] leading-[1.8] resize-none placeholder:text-slate-200 font-inter"
                                        placeholder="Start drafting your comprehensive technical documentation here..."
                                    />
                                </div>
                                <footer className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Draft version • Secure Cloud Persistence</p>
                                </footer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

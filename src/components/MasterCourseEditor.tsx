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
    Bold,
    Italic,
    Sparkles,
    Settings,
    Layers,
    Video,
    HelpCircle,
    FileText,
    Play,
    CheckCircle2,
    List
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SlideElement {
    id: string
    type: 'text' | 'image' | 'shape'
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
}

interface Slide {
    id: string
    title: string
    background_url?: string
    elements: SlideElement[]
    order_index: number
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

    // Loading State
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (module.id) {
            fetchModuleContent()
        }
    }, [module.id, module.module_type])

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

    // --- Quiz Handlers ---
    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], ...updates }
        setQuestions(newQuestions)
    }

    // --- Render Helpers ---
    if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Context Header */}
            <div className="flex items-center justify-between px-10 py-5 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${module.module_type === 'slides' ? 'bg-blue-600 text-white shadow-blue-200' :
                        module.module_type === 'video' ? 'bg-emerald-600 text-white shadow-emerald-200' :
                            'bg-purple-600 text-white shadow-purple-200'
                        }`}>
                        {module.module_type === 'slides' ? <FileText className="w-6 h-6" /> :
                            module.module_type === 'video' ? <Video className="w-6 h-6" /> :
                                <HelpCircle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{module.title}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{module.module_type} Architecture Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (module.module_type === 'slides') handleSaveSlides()
                            else if (module.module_type === 'quiz') handleSaveQuiz()
                            else handleSaveVideo()
                        }}
                        disabled={saving}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Processing...' : 'Save Changes'}
                    </button>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Slide List Sidebar */}
                <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <button
                            onClick={addNewSlide}
                            className="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-3 h-3" />
                            Add Slide
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {slides.map((s, idx) => (
                            <div key={s.id} className="relative group">
                                <button
                                    onClick={() => setActiveSlideIndex(idx)}
                                    className={`w-full aspect-video rounded-xl border-2 transition-all p-2 flex flex-col items-center justify-center text-center ${activeSlideIndex === idx ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                        }`}
                                >
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${activeSlideIndex === idx ? 'text-blue-600' : 'text-slate-500'}`}>{s.title || `Slide ${idx + 1}`}</span>
                                </button>
                                {slides.length > 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

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
                            className="aspect-video w-full max-w-[1400px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative overflow-hidden transition-all duration-500"
                            style={{
                                background: slides[activeSlideIndex]?.background_url?.startsWith('linear-gradient')
                                    ? slides[activeSlideIndex].background_url
                                    : (slides[activeSlideIndex]?.background_url ? `url(${slides[activeSlideIndex].background_url})` : '#ffffff'),
                                backgroundSize: 'cover', backgroundPosition: 'center'
                            }}
                            onClick={() => setSelectedElementId(null)}
                        >
                            {slides[activeSlideIndex]?.elements.map((el) => (
                                <div
                                    key={el.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                    className={`absolute cursor-move group/element ${selectedElementId === el.id ? 'ring-2 ring-blue-500 rounded-lg bg-blue-500/5' : ''}`}
                                    style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`, zIndex: selectedElementId === el.id ? 10 : 1 }}
                                >
                                    {el.type === 'text' && (
                                        <textarea
                                            value={el.content}
                                            onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                            className="w-full h-full bg-transparent border-none focus:ring-0 p-2 resize-none text-slate-900"
                                            style={{
                                                fontSize: `${el.fontSize}px`,
                                                textAlign: el.textAlign,
                                                color: el.color,
                                                fontFamily: el.fontFamily || 'Inter',
                                                fontWeight: el.fontWeight || 'normal',
                                                fontStyle: el.fontStyle || 'normal'
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Control Bar */}
                    <div className="mt-6 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                            <button disabled={activeSlideIndex === 0} onClick={() => setActiveSlideIndex(prev => prev - 1)} className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Slide {activeSlideIndex + 1} / {slides.length}</span>
                            <button disabled={activeSlideIndex === slides.length - 1} onClick={() => setActiveSlideIndex(prev => prev + 1)} className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>

                {/* Properties Panel */}
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

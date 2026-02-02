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
    Layers
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
}

interface Slide {
    id: string
    title: string
    background_url?: string
    elements: SlideElement[]
    order_index: number
}

interface SlideEditorProps {
    isOpen: boolean
    onClose: () => void
    moduleId: string
    moduleTitle: string
}

export default function SlideEditor({ isOpen, onClose, moduleId, moduleTitle }: SlideEditorProps) {
    const router = useRouter()
    const supabase = createClient()
    const [slides, setSlides] = useState<Slide[]>([])
    const [activeSlideIndex, setActiveSlideIndex] = useState(0)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const canvasRef = useRef<HTMLDivElement>(null)

    const activeSlide = slides[activeSlideIndex]

    useEffect(() => {
        if (isOpen && moduleId) {
            fetchSlides()
        }
    }, [isOpen, moduleId])

    async function fetchSlides() {
        setLoading(true)
        const { data, error } = await supabase
            .from('module_slides')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: true })

        if (error) {
            console.error('Error fetching slides:', error)
        } else if (data && data.length > 0) {
            setSlides(data.map(s => ({
                id: s.id,
                title: s.title || '',
                background_url: s.background_url,
                elements: s.content_json.elements || [],
                order_index: s.order_index
            })))
        } else {
            const newSlide: Slide = {
                id: crypto.randomUUID(),
                title: 'Introduction',
                elements: [
                    { id: crypto.randomUUID(), type: 'text', content: 'Double click to edit title', x: 10, y: 10, width: 80, height: 10, fontSize: 32, fontWeight: 'bold', textAlign: 'center' }
                ],
                order_index: 0
            }
            setSlides([newSlide])
        }
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        const updates = slides.map((s, idx) => ({
            id: s.id.includes('-') ? undefined : s.id,
            module_id: moduleId,
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
            router.refresh()
            onClose()
        }
        setSaving(false)
    }

    const addNewSlide = () => {
        const newSlide: Slide = {
            id: crypto.randomUUID(),
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
            setActiveSlideIndex(newSlides.length - 1)
        }
    }

    const addElement = (type: 'text' | 'image' | 'shape') => {
        if (!activeSlide) return

        const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? 'New Content' : (type === 'image' ? 'https://via.placeholder.com/300' : 'Rectangle'),
            x: 20,
            y: 20,
            width: type === 'text' ? 60 : 30,
            height: type === 'text' ? 10 : 20,
            fontSize: type === 'text' ? 18 : undefined,
            color: type === 'shape' ? '#3b82f6' : '#ffffff',
            textAlign: type === 'text' ? 'left' : undefined
        }

        const newSlides = [...slides]
        newSlides[activeSlideIndex].elements.push(newElement)
        setSlides(newSlides)
        setSelectedElementId(newElement.id)
    }

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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-[60px] animate-in fade-in duration-500 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[180px] delay-1000 animate-pulse pointer-events-none" />

            <div className="relative w-full h-full flex flex-col">
                {/* Modern Glass Header */}
                <header className="px-8 py-6 h-24 border-b border-white/5 flex justify-between items-center bg-zinc-950/20 backdrop-blur-3xl shrink-0 z-50">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center bg-zinc-900/50 border border-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="h-10 w-px bg-white/5" />
                        <div>
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{moduleTitle}</h2>
                            </div>
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                Interactive Slide Architect
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white px-10 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-95 disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Commit Changes
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Visual Navigator */}
                    <div className="w-80 border-r border-white/5 bg-zinc-950/30 backdrop-blur-2xl flex flex-col shrink-0">
                        <div className="p-8">
                            <button
                                onClick={addNewSlide}
                                className="w-full py-5 bg-blue-600/5 border border-blue-500/20 rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.05)] active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                New Concept
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-12">
                            {slides.map((slide, idx) => (
                                <div key={slide.id} className="relative group perspective-1000">
                                    <button
                                        onClick={() => setActiveSlideIndex(idx)}
                                        className={`w-full aspect-video rounded-3xl border-2 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center p-4 text-center group ${activeSlideIndex === idx ? 'border-blue-500 bg-blue-600/10 shadow-[0_0_40px_rgba(37,99,235,0.15)] scale-[1.02]' : 'border-white/5 bg-zinc-900/30 hover:border-white/20 hover:bg-zinc-800/50'}`}
                                    >
                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${activeSlideIndex === idx ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                                                {idx + 1}
                                            </span>
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${activeSlideIndex === idx ? 'text-blue-100' : 'text-zinc-600'}`}>{slide.title || 'Draft Concept'}</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-110 active:scale-90"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Creator Canvas Area */}
                    <main className="flex-1 bg-black/40 flex flex-col items-center justify-center p-12 lg:p-20 overflow-hidden relative">
                        {/* Premium Floating Toolbar */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center gap-2 shadow-[0_40px_100px_rgba(0,0,0,0.5)] z-20">
                            <button onClick={() => addElement('text')} className="p-5 hover:bg-blue-600 rounded-[2rem] text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-1.5 active:scale-95">
                                <Type className="w-5 h-5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Type</span>
                            </button>
                            <div className="w-px h-10 bg-white/5 mx-1" />
                            <button onClick={() => addElement('image')} className="p-5 hover:bg-blue-600 rounded-[2rem] text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-1.5 active:scale-95">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Media</span>
                            </button>
                            <div className="w-px h-10 bg-white/5 mx-1" />
                            <button onClick={() => addElement('shape')} className="p-5 hover:bg-blue-600 rounded-[2rem] text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-1.5 active:scale-95">
                                <Square className="w-5 h-5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Forms</span>
                            </button>
                        </div>

                        {/* Interactive Slide Canvas */}
                        <div
                            ref={canvasRef}
                            className="aspect-video w-full max-w-6xl bg-zinc-950 rounded-[3rem] shadow-[0_100px_150px_-50px_rgba(0,0,0,1)] relative overflow-hidden border border-white/10 group/canvas"
                            style={{
                                backgroundImage: activeSlide?.background_url ? `url(${activeSlide.background_url})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                            onClick={() => setSelectedElementId(null)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-emerald-600/5 pointer-events-none" />

                            {activeSlide?.elements.map((el) => (
                                <div
                                    key={el.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                    className={`absolute cursor-move group/element transition-all duration-300 ${selectedElementId === el.id ? 'ring-2 ring-blue-500 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)]' : 'hover:ring-1 hover:ring-white/20 hover:rounded-2xl'}`}
                                    style={{
                                        left: `${el.x}%`,
                                        top: `${el.y}%`,
                                        width: `${el.width}%`,
                                        height: `${el.height}%`,
                                        zIndex: selectedElementId === el.id ? 10 : 1
                                    }}
                                >
                                    {el.type === 'text' && (
                                        <textarea
                                            value={el.content}
                                            onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                            className="w-full h-full bg-transparent text-white border-none focus:ring-0 p-4 resize-none no-scrollbar font-bold tracking-tight transition-all"
                                            style={{
                                                fontSize: `${el.fontSize}px`,
                                                textAlign: el.textAlign,
                                                fontWeight: el.fontWeight,
                                                fontStyle: el.fontStyle,
                                                color: el.color,
                                                textShadow: '0 4px 10px rgba(0,0,0,0.5)'
                                            }}
                                        />
                                    )}
                                    {el.type === 'image' && (
                                        <img src={el.content} alt="Slide element" className="w-full h-full object-cover rounded-2xl shadow-2xl" />
                                    )}
                                    {el.type === 'shape' && (
                                        <div className="w-full h-full rounded-2xl" style={{ backgroundColor: el.color }} />
                                    )}

                                    {selectedElementId === el.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                                            className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/30 hover:scale-110 transition-all z-20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Navigation Footer */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8">
                            <button
                                disabled={activeSlideIndex === 0}
                                onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
                                className="w-16 h-16 bg-zinc-950/50 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-10 transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <div className="flex flex-col items-center min-w-[120px]">
                                <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em] mb-2">Sequence</span>
                                <span className="text-white text-lg font-black tracking-tighter bg-zinc-950/80 px-8 py-3 rounded-2xl border border-white/5 shadow-2xl">
                                    {activeSlideIndex + 1} <span className="text-zinc-800 mx-2 text-xl">/</span> {slides.length}
                                </span>
                            </div>
                            <button
                                disabled={activeSlideIndex === slides.length - 1}
                                onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
                                className="w-16 h-16 bg-zinc-950/50 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-10 transition-all active:scale-95"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>
                    </main>

                    {/* Right Sidebar - Dynamic Properties Section */}
                    <aside className="w-[400px] border-l border-white/5 bg-zinc-950/30 backdrop-blur-2xl p-10 space-y-12 overflow-y-auto no-scrollbar shrink-0">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Settings className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Core Blueprint</h4>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Concept Title</label>
                                    <input
                                        value={activeSlide?.title || ''}
                                        onChange={(e) => {
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].title = e.target.value
                                            setSlides(newSlides)
                                        }}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white focus:border-blue-500 focus:bg-zinc-900 outline-none transition-all shadow-inner"
                                        placeholder="Enter concept name..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Atmospheric Base (URL)</label>
                                    <input
                                        value={activeSlide?.background_url || ''}
                                        onChange={(e) => {
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].background_url = e.target.value
                                            setSlides(newSlides)
                                        }}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white focus:border-blue-500 focus:bg-zinc-900 outline-none transition-all shadow-inner"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </section>

                        {selectedElementId && (
                            <section className="space-y-8 animate-in slide-in-from-right-8 duration-500 pt-10 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <Layers className="w-4 h-4 text-blue-500" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Element Synthesis</h4>
                                </div>

                                {slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.type === 'text' && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                                    updateElement(selectedElementId, { fontWeight: el?.fontWeight === 'bold' ? 'normal' : 'bold' })
                                                }}
                                                className={`py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontWeight === 'bold' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:text-white'}`}
                                            >
                                                <Bold className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Bold</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                                    updateElement(selectedElementId, { fontStyle: el?.fontStyle === 'italic' ? 'normal' : 'italic' })
                                                }}
                                                className={`py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontStyle === 'italic' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:text-white'}`}
                                            >
                                                <Italic className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Italic</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {(['left', 'center', 'right'] as const).map((align) => (
                                                <button
                                                    key={align}
                                                    onClick={() => updateElement(selectedElementId, { textAlign: align })}
                                                    className={`flex-1 py-4 rounded-2xl border-2 transition-all flex items-center justify-center ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.textAlign === align ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900/50 border-white/5 text-zinc-600 hover:text-white'}`}
                                                >
                                                    {align === 'left' ? <AlignLeft className="w-4 h-4" /> : align === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Optimum Scaling</label>
                                                <span className="text-blue-500 font-black text-xs">{slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="12"
                                                max="160"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize || 16}
                                                onChange={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Axis X (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.x || 0}
                                                onChange={(e) => updateElement(selectedElementId, { x: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white outline-none"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Axis Y (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.y || 0}
                                                onChange={(e) => updateElement(selectedElementId, { y: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Span W (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.width || 0}
                                                onChange={(e) => updateElement(selectedElementId, { width: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white outline-none"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Span H (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.height || 0}
                                                onChange={(e) => updateElement(selectedElementId, { height: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[13px] font-bold text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Asset Source (URL)</label>
                                    <input
                                        value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.content || ''}
                                        onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-[11px] font-medium text-white outline-none focus:border-blue-500 transition-all shadow-inner"
                                    />
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    )
}

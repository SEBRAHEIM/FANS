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
            textAlign: type === 'text' ? 'left' : undefined,
            fontFamily: type === 'text' ? 'Inter' : undefined,
            letterSpacing: 0,
            lineHeight: 1.2,
            opacity: 1
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-50/95 backdrop-blur-[60px] animate-in fade-in duration-500 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[180px] delay-1000 animate-pulse pointer-events-none" />

            <div className="relative w-full h-full flex flex-col">
                {/* PowerPoint Style Top Ribbon */}
                <header className="px-6 h-20 border-b border-zinc-200 flex justify-between items-center bg-white z-50 shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onClose}
                            className="p-3 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-px bg-zinc-200" />
                        <div>
                            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">{moduleTitle}</h2>
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mt-1">Interactive Architect</p>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center px-12">
                        <div className="bg-zinc-100 rounded-xl p-1 flex items-center gap-1">
                            <button onClick={() => addElement('text')} className="flex items-center gap-2 px-6 py-2.5 hover:bg-white rounded-lg text-zinc-500 hover:text-blue-600 transition-all active:scale-95 group">
                                <Type className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Text</span>
                            </button>
                            <div className="w-px h-6 bg-zinc-200 mx-1" />
                            <button onClick={() => addElement('image')} className="flex items-center gap-2 px-6 py-2.5 hover:bg-white rounded-lg text-zinc-500 hover:text-blue-600 transition-all active:scale-95 group">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Media</span>
                            </button>
                            <div className="w-px h-6 bg-zinc-200 mx-1" />
                            <button onClick={() => addElement('shape')} className="flex items-center gap-2 px-6 py-2.5 hover:bg-white rounded-lg text-zinc-500 hover:text-blue-600 transition-all active:scale-95 group">
                                <Square className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Shapes</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Save & Close
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Slim Navigator */}
                    <div className="w-64 border-r border-zinc-200 bg-white flex flex-col shrink-0">
                        <div className="p-4 border-b border-zinc-100">
                            <button
                                onClick={addNewSlide}
                                className="w-full py-3 bg-zinc-100/50 border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <Plus className="w-3 h-3" />
                                Add Slide
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar">
                            {slides.map((slide, idx) => (
                                <div key={slide.id} className="relative group">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black w-4 text-center ${activeSlideIndex === idx ? 'text-blue-600' : 'text-zinc-400'}`}>{idx + 1}</span>
                                        <button
                                            onClick={() => setActiveSlideIndex(idx)}
                                            className={`flex-1 aspect-video rounded-xl border-2 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-2 text-center relative ${activeSlideIndex === idx ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                                        >
                                            <span className={`text-[9px] font-black uppercase tracking-widest line-clamp-1 px-2 ${activeSlideIndex === idx ? 'text-blue-600' : 'text-zinc-500'}`}>{slide.title || 'Slide'}</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-90 z-10"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Creator Canvas Area - Wider */}
                    <main className="flex-1 bg-zinc-100 flex flex-col p-8 overflow-hidden relative">
                        {/* Interactive Slide Canvas - Widescreen */}
                        <div className="flex-1 flex items-center justify-center">
                            <div
                                ref={canvasRef}
                                className="aspect-video w-[90%] bg-white rounded-xl shadow-2xl relative overflow-hidden border border-zinc-200 group/canvas"
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
                                                className="w-full h-full bg-transparent text-zinc-900 border-none focus:ring-0 p-4 resize-none no-scrollbar font-bold tracking-tight transition-all"
                                                style={{
                                                    fontSize: `${el.fontSize}px`,
                                                    textAlign: el.textAlign,
                                                    fontWeight: el.fontWeight,
                                                    fontStyle: el.fontStyle,
                                                    color: el.color,
                                                    fontFamily: el.fontFamily || 'Inter',
                                                    letterSpacing: `${el.letterSpacing}px`,
                                                    lineHeight: el.lineHeight,
                                                    opacity: el.opacity
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
                        </div>

                        {/* Navigation Footer - PowerPoint Style */}
                        <div className="h-16 flex items-center justify-between px-10 mt-4 bg-white/50 backdrop-blur-3xl rounded-2xl border border-zinc-200 shadow-sm shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    disabled={activeSlideIndex === 0}
                                    onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
                                    className="p-2 text-zinc-400 hover:text-zinc-900 disabled:opacity-10 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <span className="text-zinc-900 text-[11px] font-black tracking-widest uppercase">
                                    Slide {activeSlideIndex + 1} of {slides.length}
                                </span>
                                <button
                                    disabled={activeSlideIndex === slides.length - 1}
                                    onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
                                    className="p-2 text-zinc-400 hover:text-zinc-900 disabled:opacity-10 transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-zinc-200 mx-2" />
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    className="w-32 h-1 bg-zinc-200 rounded-full appearance-none accent-blue-600"
                                />
                            </div>
                        </div>
                    </main>

                    {/* Right Sidebar - Compact Format Pane */}
                    <aside className="w-80 border-l border-zinc-200 bg-white p-6 space-y-10 overflow-y-auto no-scrollbar shrink-0 text-zinc-800">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Slide Properties</h4>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Concept Title</label>
                                    <input
                                        value={activeSlide?.title || ''}
                                        onChange={(e) => {
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].title = e.target.value
                                            setSlides(newSlides)
                                        }}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                        placeholder="Enter concept name..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Atmospheric Base (URL)</label>
                                    <input
                                        value={activeSlide?.background_url || ''}
                                        onChange={(e) => {
                                            const newSlides = [...slides]
                                            newSlides[activeSlideIndex].background_url = e.target.value
                                            setSlides(newSlides)
                                        }}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </section>

                        {selectedElementId && (
                            <section className="space-y-8 animate-in slide-in-from-right-8 duration-500 pt-10 border-t border-zinc-100">
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
                                                className={`py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontWeight === 'bold' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-zinc-600'}`}
                                            >
                                                <Bold className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Bold</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const el = slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)
                                                    updateElement(selectedElementId, { fontStyle: el?.fontStyle === 'italic' ? 'normal' : 'italic' })
                                                }}
                                                className={`py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontStyle === 'italic' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-zinc-600'}`}
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
                                                    className={`flex-1 py-4 rounded-2xl border-2 transition-all flex items-center justify-center ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.textAlign === align ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-zinc-600'}`}
                                                >
                                                    {align === 'left' ? <AlignLeft className="w-4 h-4" /> : align === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end px-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Optimum Scale</label>
                                                    <span className="text-blue-600 font-black text-xs">{slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="8"
                                                    max="200"
                                                    value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontSize || 16}
                                                    onChange={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                                    className="w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end px-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Line Height</label>
                                                    <span className="text-blue-600 font-black text-xs">{slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.lineHeight}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.8"
                                                    max="3"
                                                    step="0.1"
                                                    value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.lineHeight || 1.2}
                                                    onChange={(e) => updateElement(selectedElementId, { lineHeight: parseFloat(e.target.value) })}
                                                    className="w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Character Spacing</label>
                                                <span className="text-blue-600 font-black text-xs">{slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.letterSpacing}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-2"
                                                max="20"
                                                step="0.5"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.letterSpacing || 0}
                                                onChange={(e) => updateElement(selectedElementId, { letterSpacing: parseFloat(e.target.value) })}
                                                className="w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>


                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Color Palette</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['#ffffff', '#000000', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateElement(selectedElementId, { color: c })}
                                                        className={`w-8 h-8 rounded-full border border-zinc-200 transition-transform hover:scale-110 active:scale-90 ${slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.color === c ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white' : ''}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.color || '#000000'}
                                                    onChange={(e) => updateElement(selectedElementId, { color: e.target.value })}
                                                    className="w-8 h-8 rounded-full bg-white border border-zinc-200 overflow-hidden p-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Typeface Selection</label>
                                            <select
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.fontFamily || 'Inter'}
                                                onChange={(e) => updateElement(selectedElementId, { fontFamily: e.target.value })}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 outline-none appearance-none"
                                            >
                                                <option value="Inter">Inter (Default)</option>
                                                <option value="'Playfair Display', serif">Playfair Display (Premium)</option>
                                                <option value="'Outfit', sans-serif">Outfit (Modern)</option>
                                                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                                <option value="'Bebas Neue', cursive">Bebas Neue (Impact)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Axis X (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.x || 0}
                                                onChange={(e) => updateElement(selectedElementId, { x: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Axis Y (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.y || 0}
                                                onChange={(e) => updateElement(selectedElementId, { y: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Span W (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.width || 0}
                                                onChange={(e) => updateElement(selectedElementId, { width: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Span H (%)</label>
                                            <input
                                                type="number"
                                                value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.height || 0}
                                                onChange={(e) => updateElement(selectedElementId, { height: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[13px] font-bold text-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Asset Source (URL)</label>
                                    <input
                                        value={slides[activeSlideIndex].elements.find(e => e.id === selectedElementId)?.content || ''}
                                        onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-[11px] font-medium text-zinc-900 outline-none focus:border-blue-500 transition-all shadow-sm"
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

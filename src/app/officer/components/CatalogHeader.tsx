'use client'

import { useState } from 'react'
import { Sparkles, ChevronRight, Plus, Search } from 'lucide-react'
import { generateSlidesAction } from '@/app/officer/ai-actions'
import { useRouter } from 'next/navigation'
import SlideEditor from '@/components/SlideEditor'

export default function CatalogHeader() {
    const [requestInput, setRequestInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingSlides, setEditingSlides] = useState<{ id: string, title: string } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    async function handleAIGenerate() {
        if (!requestInput.trim()) return
        setLoading(true)
        try {
            const result = await generateSlidesAction(requestInput)
            if (result.error) throw new Error(result.error)

            if (result.success && result.moduleId) {
                setEditingSlides({ id: result.moduleId, title: result.moduleTitle || 'AI Presentation' })
                setRequestInput('')
                router.refresh()
            }
        } catch (error: any) {
            alert('AI Generation failed: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (q: string) => {
        setSearchQuery(q)
        const url = new URL(window.location.href)
        if (q) url.searchParams.set('q', q)
        else url.searchParams.delete('q')
        window.history.pushState({}, '', url)
        window.dispatchEvent(new Event('popstate'))
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white">COURSE CATALOG</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Manage official course materials, syllabus, and COC exams.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <input
                            type="text"
                            placeholder="Filter sessions..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 px-6 pl-12 text-sm font-bold text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    </div>
                    <button
                        onClick={() => {
                            const url = new URL(window.location.href)
                            url.searchParams.set('new', 'true')
                            window.history.pushState({}, '', url)
                            window.dispatchEvent(new Event('popstate'))
                        }}
                        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 text-blue-500" />
                        <span className="hidden sm:inline">New Course</span>
                        <Plus className="w-5 h-5 sm:hidden" />
                    </button>
                </div>
            </div>

            {/* AI Request Bar - ChatGPT Style */}
            <div className="max-w-3xl mx-auto w-full mb-16">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] opacity-20 group-focus-within:opacity-100 blur transition duration-1000 group-focus-within:duration-200"></div>
                    <div className="relative flex items-center bg-zinc-950 border border-zinc-800/50 rounded-[2rem] p-2 pl-6 shadow-2xl">
                        <Sparkles className={`w-5 h-5 text-blue-500 mr-4 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
                        <input
                            type="text"
                            placeholder="What training material should I generate for you today?"
                            className="flex-1 bg-transparent border-none py-4 text-sm md:text-base font-bold text-white focus:outline-none placeholder:text-zinc-600"
                            value={requestInput}
                            onChange={(e) => setRequestInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                            disabled={loading}
                        />
                        <button
                            onClick={handleAIGenerate}
                            disabled={loading || !requestInput.trim()}
                            className={`p-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${requestInput.trim() ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-zinc-900 text-zinc-700'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {editingSlides && (
                <SlideEditor
                    isOpen={true}
                    moduleId={editingSlides.id}
                    moduleTitle={editingSlides.title}
                    onClose={() => setEditingSlides(null)}
                />
            )}
        </>
    )
}

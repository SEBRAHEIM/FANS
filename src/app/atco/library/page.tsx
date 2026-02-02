'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BookOpen,
    Search,
    Play,
    Tag,
    ChevronRight,
    Star,
    Clock,
    Lock,
    Sparkles,
    TrendingUp,
    Library,
    LayoutGrid,
    Settings
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Course {
    id: string
    title: string
    description: string
    category: string
    created_at: string
}

export default function ResourceLibrary() {
    const supabase = createClient()
    const [courses, setCourses] = useState<Course[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPublishedCourses()
    }, [])

    async function fetchPublishedCourses() {
        setLoading(true)
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('is_library_item', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching library:', error)
        } else if (data) {
            setCourses(data)
        }
        setLoading(false)
    }

    const categories = ['All', ...new Set(courses.map(c => c.category || 'General'))]

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-black overflow-hidden relative">
            {/* Background Aesthetic Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 p-8 lg:p-16 max-w-[1600px] mx-auto">
                {/* Stunning Hero Section */}
                {/* High-End Centralized Header */}
                <header className="max-w-4xl mx-auto mb-20 text-center space-y-8">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                        <Library className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Universal Academy</span>
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tight uppercase leading-none">
                        FANS <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">Academy</span>
                    </h1>

                    <p className="text-zinc-500 text-lg lg:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Expand your expertise with clinical precision. Master advanced procedures at your own pace.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search the academy..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-2xl pl-16 pr-8 py-5 w-full text-zinc-200 font-bold focus:bg-zinc-900/60 focus:border-blue-500 outline-none transition-all shadow-2xl"
                            />
                        </div>
                        <div className="flex bg-zinc-900/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                            <div className="flex items-center gap-6 px-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-white text-lg font-black">{courses.length}</span>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Materials</span>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-emerald-500 text-lg font-black">{categories.length - 1}</span>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Paths</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Apple-Style Segmented Navigation */}
                <div className="mb-20">
                    <div className="bg-zinc-900/30 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-2 flex items-center justify-center flex-wrap gap-1 shadow-2xl">
                        {categories.map((cat, idx) => (
                            <div key={cat} className="flex items-center">
                                <button
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                                        selectedCategory === cat
                                            ? "bg-white text-black shadow-xl"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {cat}
                                </button>
                                {idx < categories.length - 1 && <div className="w-px h-6 bg-white/5 mx-2 hidden lg:block" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Academy Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            className="group relative aspect-video"
                        >
                            {/* Atmospheric Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <article className="relative h-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-700 group-hover:bg-zinc-900/60 group-hover:scale-[1.02]">
                                {/* Static Face - Ultra Clean */}
                                <div className="absolute top-8 left-8 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                    {course.category || 'General'}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none group-hover:text-blue-400 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-zinc-500 text-sm font-medium line-clamp-2 max-w-[280px] leading-relaxed">
                                        {course.description || "Master this operational blueprint to advance your controlling proficiency."}
                                    </p>
                                </div>

                                {/* Interactive Overlay */}
                                <Link
                                    href={`/atco/classroom/${course.id}`}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-10 translate-y-4 group-hover:translate-y-0"
                                >
                                    <div className="w-full space-y-8">
                                        <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5">
                                            <div className="flex-1 px-4 py-3 flex flex-col items-start gap-1 border-r border-white/10">
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Time</span>
                                                <span className="text-[10px] font-bold uppercase text-white">15 MIN</span>
                                            </div>
                                            <div className="flex-1 px-4 py-3 flex flex-col items-start gap-1">
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Type</span>
                                                <span className="text-[10px] font-bold uppercase text-white">Theory</span>
                                            </div>
                                        </div>

                                        <div className="w-full py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center gap-3">
                                            <Play className="w-3 h-3 fill-current" /> Begin Training
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {!loading && filteredCourses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="p-10 bg-zinc-900/40 rounded-[3rem] border border-white/5 mb-8">
                            <LayoutGrid className="w-16 h-16 text-zinc-800" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">No Archives Found</h3>
                        <p className="text-zinc-500 text-lg max-w-md mx-auto">
                            The requested blueprint could not be located in the academy database. Try a different category or refining your search.
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.6em] mt-10">Infiltrating Knowledge Grids...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

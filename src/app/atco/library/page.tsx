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
    LayoutGrid
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
                <header className="mb-20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                    <Library className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Universal Knowledge Hub</span>
                            </div>
                            <h1 className="text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase mb-6 leading-[0.9]">
                                FANS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">Academy</span>
                            </h1>
                            <p className="text-zinc-500 text-xl font-medium leading-relaxed">
                                Expand your expertise with our comprehensive library of self-study materials.
                                Master advanced procedures and theoretical foundations at your own pace.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search the academy..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2rem] pl-16 pr-8 py-6 w-full lg:w-[400px] text-zinc-200 font-bold focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all shadow-2xl"
                                />
                            </div>
                            <div className="flex items-center gap-6 px-4">
                                <div className="flex flex-col">
                                    <span className="text-white text-2xl font-black">{courses.length}</span>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Available Materials</span>
                                </div>
                                <div className="w-px h-8 bg-zinc-800" />
                                <div className="flex flex-col">
                                    <span className="text-emerald-500 text-2xl font-black">{categories.length - 1}</span>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Specializations</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Refined Category Navigator */}
                <div className="mb-16 flex items-center gap-3 overflow-x-auto no-scrollbar pb-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border",
                                selectedCategory === cat
                                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                                    : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Academy Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {filteredCourses.map((course) => (
                        <Link
                            href={`/atco/trainings/${course.id}`}
                            key={course.id}
                            className="group relative"
                        >
                            {/* Animated Outer Border Glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[3rem] blur opacity-0 group-hover:opacity-30 transition-opacity duration-1000" />

                            <article className="relative h-[480px] bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex flex-col transition-all duration-700 hover:translate-y-[-12px] group-hover:bg-zinc-900/60 overflow-hidden">
                                {/* Top Badges */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className="px-5 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                        {course.category || 'General'}
                                    </div>
                                    <div className="p-3 bg-zinc-950/50 rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                </div>

                                {/* Main Title & Description */}
                                <div className="flex-1">
                                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-4 leading-[1.1] transition-colors group-hover:text-blue-400">
                                        {course.title}
                                    </h3>
                                    <p className="text-zinc-500 text-base font-medium leading-relaxed line-clamp-4 group-hover:text-zinc-400 transition-colors">
                                        {course.description || 'Master this operational blueprint to advance your controlling proficiency.'}
                                    </p>
                                </div>

                                {/* Bottom Meta Data */}
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</span>
                                                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                                                    <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                                                    Self-Study
                                                </div>
                                            </div>
                                            <div className="w-px h-6 bg-zinc-800" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Access</span>
                                                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                                                    <Lock className="w-3.5 h-3.5 text-zinc-600" />
                                                    Unlocked
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                            <Play className="w-6 h-6 fill-current" />
                                        </div>
                                    </div>
                                </div>

                                {/* Background Geometric Decor */}
                                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-600/5 rounded-full blur-[60px] group-hover:bg-blue-600/10 transition-colors pointer-events-none" />
                            </article>
                        </Link>
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

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BookOpen,
    Search,
    Filter,
    MoreVertical,
    Eye,
    EyeOff,
    Tag,
    ChevronRight,
    Layout,
    Globe,
    Lock,
    Sparkles,
    Shapes,
    GraduationCap,
    Clock,
    Settings,
    Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Course {
    id: string
    title: string
    description: string
    is_library_item: boolean
    category: string
    created_at: string
}

const CATEGORIES = [
    'General',
    'Radar Operations',
    'Tower Control',
    'Emergency Procedures',
    'Weather & Environment',
    'Human Factors'
]

export default function LibraryArchitect() {
    const supabase = createClient()
    const [courses, setCourses] = useState<Course[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCourses()
    }, [])

    async function fetchCourses() {
        setLoading(true)
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching courses:', error)
        } else if (data) {
            setCourses(data)
        }
        setLoading(false)
    }

    async function toggleLibraryStatus(courseId: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('courses')
            .update({ is_library_item: !currentStatus })
            .eq('id', courseId)

        if (error) {
            alert('Error updating visibility')
        } else {
            setCourses(courses.map(c =>
                c.id === courseId ? { ...c, is_library_item: !currentStatus } : c
            ))
        }
    }

    async function updateCategory(courseId: string, category: string) {
        const { error } = await supabase
            .from('courses')
            .update({ category })
            .eq('id', courseId)

        if (!error) {
            setCourses(courses.map(c =>
                c.id === courseId ? { ...c, category } : c
            ))
        }
    }

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-black p-8 lg:p-12">
            {/* Header Section */}
            {/* Centralized High-End Command Hub */}
            <div className="max-w-4xl mx-auto mb-20 text-center space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Academy Architect</span>
                </div>

                <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tight uppercase leading-none">
                    Academy <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">Library</span>
                </h1>

                <p className="text-zinc-500 text-lg lg:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    A centralized control center for managing and publishing world-class training materials.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <div className="relative group w-full sm:w-80">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-2xl pl-16 pr-8 py-5 w-full text-zinc-200 font-bold focus:bg-zinc-900/60 focus:border-blue-500 outline-none transition-all shadow-2xl"
                        />
                    </div>
                    <div className="flex bg-zinc-900/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                        {['All', 'Public', 'Draft'].map((tab) => (
                            <button key={tab} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all whitespace-nowrap">
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Apple-Style Segmented Navigation */}
            <div className="max-w-5xl mx-auto mb-20">
                <div className="bg-zinc-900/30 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-2 flex items-center justify-center flex-wrap gap-1 shadow-2xl">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={cn(
                            "px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                            selectedCategory === 'All'
                                ? "bg-white text-black shadow-xl"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Universal Access
                    </button>
                    <div className="w-px h-6 bg-white/5 mx-2 hidden lg:block" />
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
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
                    ))}
                </div>
            </div>

            {/* Main Library Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="group relative aspect-video">
                        {/* Hover Background Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative h-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center transition-all duration-700 group-hover:bg-zinc-900/60 overflow-hidden">
                            {/* Static Face - Ultra Clean */}
                            <div className="absolute top-8 left-8 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                {course.category || 'General'}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none group-hover:text-blue-400 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-zinc-500 text-sm font-medium line-clamp-2 max-w-[280px] leading-relaxed">
                                    {course.description || "No blueprint provided."}
                                </p>
                            </div>

                            {/* Hover Interactive Overlay */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-10 translate-y-4 group-hover:translate-y-0">
                                <div className="w-full space-y-8">
                                    <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5">
                                        <div className="flex-1 px-4 py-3 flex flex-col items-start gap-1 border-r border-white/10">
                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Status</span>
                                            <span className={cn("text-[10px] font-bold uppercase", course.is_library_item ? "text-emerald-500" : "text-orange-500")}>
                                                {course.is_library_item ? "Public" : "Archived"}
                                            </span>
                                        </div>
                                        <div className="flex-1 px-4 py-3 flex flex-col items-start gap-1">
                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Assigned</span>
                                            <span className="text-[10px] font-bold uppercase text-white">General</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => toggleLibraryStatus(course.id, course.is_library_item)}
                                            className={cn(
                                                "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                course.is_library_item
                                                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                            )}
                                        >
                                            {course.is_library_item ? "Archive" : "Publish"}
                                        </button>
                                        <button className="py-4 bg-white/10 border border-white/5 rounded-2xl text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                            <Settings className="w-3 h-3" /> Config
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Archives...</span>
                </div>
            )}
        </div>
    )
}

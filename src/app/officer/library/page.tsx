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
    Clock
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
            <div className="max-w-7xl mx-auto mb-16">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                <GraduationCap className="w-6 h-6 text-blue-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Resource Architect</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">Academy <span className="text-blue-600">Library</span></h1>
                        <p className="text-zinc-500 text-lg font-medium max-w-2xl">Manage and categorize self-study materials. Published items are visible to all ATCOs in the Resource Library.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-14 pr-6 py-4 w-72 text-zinc-300 font-bold focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all shadow-xl"
                            />
                        </div>
                        <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
                            {['All', 'Public', 'Draft'].map((tab) => (
                                <button key={tab} className="px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter Bar */}
            <div className="max-w-7xl mx-auto mb-12 overflow-x-auto no-scrollbar flex items-center gap-4 pb-4">
                <button
                    onClick={() => setSelectedCategory('All')}
                    className={cn(
                        "px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                        selectedCategory === 'All'
                            ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            : "bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:text-white hover:border-zinc-700"
                    )}
                >
                    Universal Access
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                            selectedCategory === cat
                                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                : "bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:text-white hover:border-zinc-700"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Library Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="group relative">
                        {/* Hover Background Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative h-full bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-8 flex flex-col transition-all duration-500 hover:translate-y-[-8px] hover:border-blue-500/30 overflow-hidden">
                            {/* Card Content */}
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                    course.is_library_item
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                        : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", course.is_library_item ? "bg-emerald-500" : "bg-orange-500")} />
                                    {course.is_library_item ? 'Public Library' : 'Internal Archive'}
                                </div>
                                <div className="p-2 bg-zinc-950/50 rounded-xl text-zinc-600 hover:text-white cursor-pointer transition-colors shadow-inner">
                                    <MoreVertical className="w-5 h-5" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-3 line-clamp-1">{course.title}</h3>
                            <p className="text-zinc-500 text-sm font-medium mb-8 line-clamp-2 leading-relaxed">{course.description || 'No blueprint provided.'}</p>

                            <div className="mt-auto space-y-6">
                                <div className="flex items-center gap-3">
                                    <Tag className="w-4 h-4 text-blue-500" />
                                    <select
                                        value={course.category || 'General'}
                                        onChange={(e) => updateCategory(course.id, e.target.value)}
                                        className="bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 focus:text-blue-400 transition-all outline-none cursor-pointer"
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={() => toggleLibraryStatus(course.id, course.is_library_item)}
                                    className={cn(
                                        "w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
                                        course.is_library_item
                                            ? "bg-zinc-950/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
                                            : "bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500"
                                    )}
                                >
                                    {course.is_library_item ? (
                                        <><EyeOff className="w-4 h-4" /> Move to Archive</>
                                    ) : (
                                        <><Eye className="w-4 h-4" /> Publish to Academy</>
                                    )}
                                </button>
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

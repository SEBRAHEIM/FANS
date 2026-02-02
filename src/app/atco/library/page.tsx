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
    Library,
    LayoutGrid,
    Settings,
    Folder,
    Home,
    Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Course {
    id: string
    title: string
    description: string
    category: string
    folder_id: string | null
    created_at: string
}

interface Folder {
    id: string
    name: string
    parent_id: string | null
    created_at: string
}

export default function ResourceLibrary() {
    const supabase = createClient()
    const [courses, setCourses] = useState<Course[]>([])
    const [folders, setFolders] = useState<Folder[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [breadcrumbPath, setBreadcrumbPath] = useState<Folder[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEverything()
    }, [currentFolderId])

    async function fetchEverything() {
        setLoading(true)

        // Folders
        let folderQuery = supabase.from('library_folders').select('*')
        if (currentFolderId) {
            folderQuery = folderQuery.eq('parent_id', currentFolderId)
        } else {
            folderQuery = folderQuery.is('parent_id', null)
        }
        const { data: fData } = await folderQuery.order('name')
        if (fData) setFolders(fData)

        // Published Courses
        let courseQuery = supabase.from('courses').select('*').eq('is_library_item', true)
        if (searchQuery) {
            // Global search
        } else if (currentFolderId) {
            courseQuery = courseQuery.eq('folder_id', currentFolderId)
        } else {
            courseQuery = courseQuery.is('folder_id', null)
        }

        const { data: cData, error } = await courseQuery.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching library:', error)
        } else if (cData) {
            setCourses(cData)
        }

        setLoading(false)
    }

    function navigateToFolder(folder: Folder | null) {
        if (!folder) {
            setCurrentFolderId(null)
            setBreadcrumbPath([])
        } else {
            setCurrentFolderId(folder.id)
            const idx = breadcrumbPath.findIndex(b => b.id === folder.id)
            if (idx !== -1) {
                setBreadcrumbPath(breadcrumbPath.slice(0, idx + 1))
            } else {
                setBreadcrumbPath([...breadcrumbPath, folder])
            }
        }
    }

    const categories = ['All', ...new Set(courses.map(c => c.category || 'General'))]

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    return (
        <div className="p-8 lg:p-16 max-w-[1600px] mx-auto">
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

            {/* Breadcrumb Navigation */}
            <div className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
                <nav className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 px-8 py-4 rounded-[1.5rem] shadow-2xl">
                    <button
                        onClick={() => navigateToFolder(null)}
                        className={cn(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors",
                            !currentFolderId ? "text-blue-500" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        <Home className="w-4 h-4" /> Academy
                    </button>

                    {breadcrumbPath.map((folder, idx) => (
                        <div key={folder.id} className="flex items-center gap-4">
                            <ChevronRight className="w-4 h-4 text-zinc-800" />
                            <button
                                onClick={() => navigateToFolder(folder)}
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                                    idx === breadcrumbPath.length - 1 ? "text-blue-500" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                {folder.name}
                            </button>
                        </div>
                    ))}
                </nav>

                <div className="flex items-center gap-8 px-6 overflow-hidden">
                    <div className="flex flex-col items-end">
                        <span className="text-white text-xl font-black tabular-nums">{folders.length}</span>
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Folders</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-900" />
                    <div className="flex flex-col items-end">
                        <span className="text-white text-xl font-black tabular-nums">{courses.length}</span>
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Resources</span>
                    </div>
                </div>
            </div>

            {/* Academy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* Folder Cards */}
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className="group relative aspect-video cursor-pointer"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative h-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center transition-all duration-700 group-hover:bg-zinc-900/60 overflow-hidden">
                            <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Folder className="w-10 h-10 text-blue-500 fill-blue-500/20" />
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2 group-hover:text-blue-400 transition-colors">
                                {folder.name}
                            </h3>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Training Path</span>
                        </div>
                    </div>
                ))}

                {/* Published Courses */}
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
    )
}

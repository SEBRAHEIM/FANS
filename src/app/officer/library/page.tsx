'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BookOpen,
    Search,
    Filter,
    MoreVertical,
    Layout,
    Globe,
    Lock,
    Sparkles,
    Shapes,
    GraduationCap,
    Clock,
    Settings,
    Play,
    FolderPlus,
    FilePlus,
    Folder,
    Home,
    ChevronRight,
    Eye,
    EyeOff,
    Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Course {
    id: string
    title: string
    description: string
    is_library_item: boolean
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

        // Fetch Folders in current directory
        const { data: folderData } = await supabase
            .from('library_folders')
            .select('*')
            .eq(currentFolderId ? 'parent_id' : 'id', currentFolderId) // This logic is slightly wrong for root, fixed below

        // Correct root vs subfolder logic
        let folderQuery = supabase.from('library_folders').select('*')
        if (currentFolderId) {
            folderQuery = folderQuery.eq('parent_id', currentFolderId)
        } else {
            folderQuery = folderQuery.is('parent_id', null)
        }

        const { data: fData } = await folderQuery.order('name')
        if (fData) setFolders(fData)

        // Fetch Courses in current directory (unless searching - search is global)
        let courseQuery = supabase.from('courses').select('*')
        if (searchQuery) {
            // Global search
        } else if (currentFolderId) {
            courseQuery = courseQuery.eq('folder_id', currentFolderId)
        } else {
            courseQuery = courseQuery.is('folder_id', null)
        }

        const { data: cData, error } = await courseQuery.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching courses:', error)
        } else if (cData) {
            setCourses(cData)
        }

        // Fetch Breadcrumb info if in a subfolder
        if (currentFolderId) {
            const { data: bData } = await supabase
                .from('library_folders')
                .select('*')
                .eq('id', currentFolderId)
                .single()
            if (bData && !breadcrumbPath.find(b => b.id === bData.id)) {
                // This is a simplified fetch, ideally we'd fetch the whole path if someone lands directly
                // For now, we'll build it as they navigate
            }
        } else {
            setBreadcrumbPath([])
        }

        setLoading(false)
    }

    async function createFolder() {
        const name = prompt('Enter folder name:')
        if (!name) return

        const { data, error } = await supabase
            .from('library_folders')
            .insert({
                name,
                parent_id: currentFolderId
            })
            .select()
            .single()

        if (!error && data) {
            setFolders([...folders, data])
        }
    }

    function navigateToFolder(folder: Folder | null) {
        if (!folder) {
            setCurrentFolderId(null)
            setBreadcrumbPath([])
        } else {
            setCurrentFolderId(folder.id)
            // Check if folder is already in path to prevent duplicates when clicking back
            const idx = breadcrumbPath.findIndex(b => b.id === folder.id)
            if (idx !== -1) {
                setBreadcrumbPath(breadcrumbPath.slice(0, idx + 1))
            } else {
                setBreadcrumbPath([...breadcrumbPath, folder])
            }
        }
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
        return matchesSearch
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
                    <div className="flex items-center gap-2 bg-zinc-900/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                        <button
                            onClick={createFolder}
                            className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-all border border-blue-500/20"
                        >
                            <FolderPlus className="w-4 h-4" /> New Folder
                        </button>
                        <button className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-white/5 border border-white/5">
                            <FilePlus className="w-4 h-4" /> New Resource
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Breadcrumb Architecture */}
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

            {/* Unified Explorer Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Directory Node</span>
                        </div>
                    </div>
                ))}

                {/* Resource Cards */}
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

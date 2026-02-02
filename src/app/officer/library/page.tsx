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
    Tag,
    Trash2,
    Edit3,
    Move,
    Check
} from 'lucide-react'
import {
    updateLibraryFolder,
    deleteLibraryFolder,
    moveCourseToFolder,
    updateCourseLibraryMetadata
} from '../library-actions'
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

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
const RESOURCE_TYPES = ['Theory', 'Practical', 'Exam', 'Guide']

export default function LibraryArchitect() {
    const supabase = createClient()
    const [courses, setCourses] = useState<Course[]>([])
    const [folders, setFolders] = useState<Folder[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [breadcrumbPath, setBreadcrumbPath] = useState<Folder[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // UI States for Modals
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [activeItem, setActiveItem] = useState<{ id: string, name: string, type: 'folder' | 'resource', metadata?: any } | null>(null)
    const [moveTargetId, setMoveTargetId] = useState<string | null>(null)

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
                parent_id: currentFolderId,
                created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single()

        if (!error && data) {
            setFolders([...folders, data])
        }
    }

    async function handleRename() {
        if (!activeItem) return
        const newName = prompt('Enter new name:', activeItem.name)
        if (!newName || newName === activeItem.name) return

        setActionLoading(true)
        if (activeItem.type === 'folder') {
            const res = await updateLibraryFolder(activeItem.id, newName)
            if (res.success) fetchEverything()
        } else {
            const res = await updateCourseLibraryMetadata(activeItem.id, { title: newName })
            if (res.success) fetchEverything()
        }
        setActionLoading(false)
        setActiveItem(null)
    }

    async function handleDelete(id: string, type: 'folder' | 'resource') {
        if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return

        setActionLoading(true)
        if (type === 'folder') {
            const res = await deleteLibraryFolder(id)
            if (res.success) fetchEverything()
        } else {
            const { deleteCourseAction } = await import('../actions')
            const res = await deleteCourseAction(id)
            if (res.success) fetchEverything()
        }
        setActionLoading(false)
        setActiveItem(null)
    }

    async function handleMove() {
        if (!activeItem) return

        setActionLoading(true)
        if (activeItem.type === 'folder') {
            const res = await updateLibraryFolder(activeItem.id, activeItem.name, moveTargetId)
            if (res.success) fetchEverything()
        } else {
            const res = await moveCourseToFolder(activeItem.id, moveTargetId)
            if (res.success) fetchEverything()
        }
        setActionLoading(false)
        setIsMoveModalOpen(false)
        setActiveItem(null)
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
        <div className="p-8 lg:p-12 pt-24 lg:pt-10">
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
                        <button
                            onClick={() => window.location.href = '/officer/planning'}
                            className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-white/5 border border-white/5"
                        >
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
                        className="group relative aspect-video cursor-pointer"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div
                            onClick={() => navigateToFolder(folder)}
                            className="relative h-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center transition-all duration-700 group-hover:bg-zinc-900/60 overflow-hidden"
                        >
                            <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Folder className="w-10 h-10 text-blue-500 fill-blue-500/20" />
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2 group-hover:text-blue-400 transition-colors">
                                {folder.name}
                            </h3>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Directory Node</span>
                        </div>

                        {/* Folder Management Handle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveItem({ id: folder.id, name: folder.name, type: 'folder' });
                            }}
                            className="absolute top-8 right-8 p-3 bg-zinc-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-950 z-10"
                        >
                            <MoreVertical className="w-5 h-5 text-zinc-500" />
                        </button>

                        {/* Folder Actions Overlay */}
                        {activeItem?.id === folder.id && activeItem.type === 'folder' && (
                            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 rounded-[2.5rem] animate-in fade-in zoom-in duration-300">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveItem(null); }}
                                    className="absolute top-6 right-6 text-zinc-500 hover:text-white"
                                >
                                    <EyeOff className="w-6 h-6" />
                                </button>

                                <div className="w-full max-w-xs space-y-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRename(); }}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 flex items-center justify-center gap-3 transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" /> Rename Folder
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsMoveModalOpen(true); }}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 flex items-center justify-center gap-3 transition-all"
                                    >
                                        <Move className="w-4 h-4" /> Move Folder
                                    </button>
                                    <div className="h-px bg-white/5 my-2" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }}
                                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 flex items-center justify-center gap-3 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Folder
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Resource Cards */}
                {filteredCourses.map((course) => (
                    <div key={course.id} className="group relative aspect-video">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative h-full bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center transition-all duration-700 group-hover:bg-zinc-900/60 overflow-hidden">
                            <div className="absolute top-8 left-8 flex gap-2">
                                <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                    {course.category || 'General'}
                                </div>
                                {course.is_library_item && (
                                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                        Published
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setActiveItem({ id: course.id, name: course.title, type: 'resource' })
                                }}
                                className="absolute top-8 right-8 p-3 bg-zinc-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-950"
                            >
                                <MoreVertical className="w-5 h-5 text-zinc-500" />
                            </button>

                            <div className="space-y-4">
                                <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none group-hover:text-blue-400 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-zinc-500 text-sm font-medium line-clamp-2 max-w-[280px] leading-relaxed">
                                    {course.description || "No blueprint provided."}
                                </p>
                            </div>

                            {/* Actions Overlay */}
                            {activeItem?.id === course.id && (
                                <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                                    <button
                                        onClick={() => setActiveItem(null)}
                                        className="absolute top-6 right-6 text-zinc-500 hover:text-white"
                                    >
                                        <EyeOff className="w-6 h-6" />
                                    </button>

                                    <div className="w-full max-w-xs space-y-3">
                                        <button
                                            onClick={() => {
                                                // Find full course data to populate editor
                                                const course = courses.find(c => c.id === activeItem?.id);
                                                setActiveItem({ ...activeItem!, metadata: course });
                                                setIsEditModalOpen(true);
                                            }}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 flex items-center justify-center gap-3 transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" /> Edit Metadata
                                        </button>
                                        <button
                                            onClick={() => setIsMoveModalOpen(true)}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 flex items-center justify-center gap-3 transition-all"
                                        >
                                            <Move className="w-4 h-4" /> Move Resource
                                        </button>
                                        <button
                                            onClick={() => toggleLibraryStatus(course.id, course.is_library_item)}
                                            className={cn(
                                                "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                                course.is_library_item ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            )}
                                        >
                                            <Globe className="w-4 h-4" /> {course.is_library_item ? "Unpublish" : "Publish to Academy"}
                                        </button>
                                        <div className="h-px bg-white/5 my-2" />
                                        <button
                                            onClick={() => handleDelete(course.id, 'resource')}
                                            className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 flex items-center justify-center gap-3 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete Resource
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Metadata Modal */}
            {isEditModalOpen && activeItem?.type === 'resource' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] w-full max-w-2xl p-10 space-y-8 animate-in zoom-in slide-in-from-bottom-4 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Edit Resource</h2>
                            <p className="text-zinc-500 font-medium italic">Configuring blueprint for <span className="text-blue-400">"{activeItem.name}"</span></p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Title</label>
                                    <input
                                        type="text"
                                        defaultValue={activeItem.metadata?.title}
                                        onChange={(e) => setActiveItem({ ...activeItem, metadata: { ...activeItem.metadata, title: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Category</label>
                                    <select
                                        defaultValue={activeItem.metadata?.category || 'General'}
                                        onChange={(e) => setActiveItem({ ...activeItem, metadata: { ...activeItem.metadata, category: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        defaultValue={activeItem.metadata?.estimated_duration || 15}
                                        onChange={(e) => setActiveItem({ ...activeItem, metadata: { ...activeItem.metadata, estimated_duration: parseInt(e.target.value) } })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Difficulty</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DIFFICULTIES.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setActiveItem({ ...activeItem, metadata: { ...activeItem.metadata, difficulty_level: d } })}
                                                className={cn(
                                                    "py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                                    (activeItem.metadata?.difficulty_level || 'Intermediate') === d
                                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                        : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Resource Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {RESOURCE_TYPES.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setActiveItem({ ...activeItem, metadata: { ...activeItem.metadata, resource_type: t } })}
                                                className={cn(
                                                    "py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                                    (activeItem.metadata?.resource_type || 'Theory') === t
                                                        ? "bg-zinc-100 border-white text-zinc-950 uppercase"
                                                        : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Description</label>
                                    <textarea
                                        defaultValue={activeItem.metadata?.description}
                                        onChange={(e) => setActiveItem({ ...activeItem, metadata: { ...activeItem.metadata, description: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-blue-500 outline-none transition-all h-32 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setActionLoading(true);
                                    const res = await updateCourseLibraryMetadata(activeItem.id, activeItem.metadata);
                                    if (res.success) fetchEverything();
                                    setActionLoading(false);
                                    setIsEditModalOpen(false);
                                    setActiveItem(null);
                                }}
                                disabled={actionLoading}
                                className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all"
                            >
                                {actionLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Move {activeItem?.type}</h2>
                            <p className="text-zinc-500 font-medium italic text-sm">Select target destination for <span className="text-blue-400">"{activeItem?.name}"</span></p>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <button
                                onClick={() => setMoveTargetId(null)}
                                className={cn(
                                    "w-full px-6 py-4 rounded-2xl flex items-center justify-between text-left transition-all",
                                    moveTargetId === null ? "bg-blue-600/10 border border-blue-500/20 text-blue-400" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]">
                                    <Home className="w-4 h-4" /> Academy Root
                                </div>
                                {moveTargetId === null && <Check className="w-4 h-4" />}
                            </button>

                            {folders.filter(f => f.id !== activeItem?.id).map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => setMoveTargetId(folder.id)}
                                    className={cn(
                                        "w-full px-6 py-4 rounded-2xl flex items-center justify-between text-left transition-all",
                                        moveTargetId === folder.id ? "bg-blue-600/10 border border-blue-500/20 text-blue-400" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]">
                                        <Folder className="w-4 h-4" /> {folder.name}
                                    </div>
                                    {moveTargetId === folder.id && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setIsMoveModalOpen(false)}
                                className="flex-1 py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMove}
                                disabled={actionLoading}
                                className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition-all"
                            >
                                {actionLoading ? "Moving..." : "Confirm Move"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Archives...</span>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, Video, HelpCircle, FileText, ChevronRight, Play, CheckCircle2, MoreVertical, Trash2, Settings, X, Users, LayoutDashboard, Search, Sparkles, Image as ImageIcon, Type, Palette, Eye, UserPlus, Trash, Bold, Italic, List } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import QuizCreator from './QuizCreator'
import CourseAssignment from './CourseAssignment'
import * as tus from 'tus-js-client'
import { deleteCourseAction } from '@/app/officer/actions'
import { generateSlidesAction } from '@/app/officer/ai-actions'
import SlideEditor from './SlideEditor'
import CourseDetailsPreview from './CourseDetailsPreview'

interface Course {
    id: string
    title: string
    description: string
    type: string
    is_library_item?: boolean
    category?: string
    modules?: Module[]
    detailed_content?: string
    objectives?: string[]
    target_audience?: string
    instructors?: { name: string, role: string, avatar_url?: string }[]
    custom_settings?: {
        fontFamily?: string
        themeColor?: string
        fontSize?: string
    }
}

interface Module {
    id: string
    title: string
    module_type: 'video' | 'quiz' | 'document' | 'live' | 'slides'
    order_index: number
    video_url?: string // Legacy single video support
    video_source?: 'youtube' | 'vimeo' | 'storage'
    is_unskippable?: boolean
    videos?: { id: string, url: string, title: string, duration?: number, source: string }[]
}

interface CourseManagerProps {
    initialCourses: Course[]
    enableAssignments?: boolean
}

export default function CourseManager({ initialCourses, enableAssignments = false }: CourseManagerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [courses, setCourses] = useState(initialCourses)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [isAddingCourse, setIsAddingCourse] = useState(false)

    useEffect(() => {
        const q = searchParams.get('q') || ''
        setSearchQuery(q)

        if (searchParams.get('new') === 'true') {
            setIsAddingCourse(true)
            // Clear the param after opening to avoid reopening on refresh
            const url = new URL(window.location.href)
            url.searchParams.delete('new')
            window.history.replaceState({}, '', url)
        }
    }, [searchParams])
    const [courseStep, setCourseStep] = useState(1)
    const [moduleStep, setModuleStep] = useState(1)
    const [creationType, setCreationType] = useState<'professional' | 'archive' | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        detailed_content: '',
        objectives: [] as string[],
        target_audience: '',
        instructors: [] as { name: string, role: string, avatar_url?: string }[],
        type: 'video',
        is_library_item: false,
        category: 'General',
        visibility_type: 'public' as 'public' | 'internal' | 'archive',
        cover_page_url: '',
        custom_settings: {
            fontFamily: 'Inter',
            themeColor: '#3b82f6',
            fontSize: 'base'
        }
    })
    const [loading, setLoading] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [activeModuleIndex, setActiveModuleIndex] = useState(0)
    const [builderModules, setBuilderModules] = useState<any[]>([
        { id: crypto.randomUUID(), title: 'Introduction', module_type: 'slides', video_url: '', video_source: 'youtube', is_unskippable: false, videos: [] }
    ])
    const [isAddingModule, setIsAddingModule] = useState(false)
    const [newModule, setNewModule] = useState({
        title: '',
        module_type: 'video',
        video_url: '',
        video_source: 'youtube' as 'youtube' | 'vimeo' | 'storage',
        is_unskippable: false,
        add_quiz: false,
        videos: [] as { id: string, url: string, title: string, source: string }[]
    })
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [configuringQuiz, setConfiguringQuiz] = useState<{ id: string, title: string, module_type: string, videos?: any[] } | null>(null)
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [assigningCourse, setAssigningCourse] = useState<{ id: string, title: string } | null>(null)
    const [editingSlides, setEditingSlides] = useState<{ id: string, title: string } | null>(null)

    const supabase = createClient()

    async function handleAddCourse(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        // 1. Create the course
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .insert([{
                title: newCourse.title,
                description: newCourse.description || (creationType === 'archive' ? 'Standalone evaluation module' : ''),
                type: newCourse.type === 'video' ? 'course' : (newCourse.type === 'quiz' ? 'exam' : newCourse.type),
                is_library_item: creationType === 'professional' ? true : false,
                category: newCourse.category,
                visibility_type: creationType === 'archive' ? 'archive' : 'public',
                cover_page_url: newCourse.cover_page_url,
                detailed_content: newCourse.detailed_content,
                objectives: newCourse.objectives,
                target_audience: newCourse.target_audience,
                instructors: newCourse.instructors,
                custom_settings: newCourse.custom_settings,
                created_by: user?.id
            }])
            .select()
            .single()

        if (courseError) {
            alert('Error creating course: ' + courseError.message)
            setLoading(false)
            return
        }

        // 2. Create the initial modules from builderModules (for Professional) or newModule (for Archive)
        const modulesToInsert = creationType === 'professional'
            ? builderModules.map((m, idx) => ({
                course_id: courseData.id,
                title: m.title || 'Untitled Module',
                module_type: m.module_type,
                video_url: m.video_url,
                video_source: m.video_source,
                is_unskippable: m.is_unskippable || false,
                videos: m.videos || [],
                order_index: idx + 1
            }))
            : [{
                course_id: courseData.id,
                title: newCourse.title,
                module_type: newCourse.type === 'video' ? 'video' : newCourse.type === 'live' ? 'live' : 'quiz',
                video_url: newModule.video_url,
                video_source: newModule.video_source,
                is_unskippable: newModule.is_unskippable,
                videos: newModule.videos,
                order_index: 1
            }]

        const { data: moduleData, error: moduleError } = await supabase
            .from('course_modules')
            .insert(modulesToInsert)
            .select()

        if (moduleError) {
            alert('Error creating modules: ' + moduleError.message)
        } else {
            // 3. Reset state
            setIsAddingCourse(false)
            setCourseStep(1)
            setActiveModuleIndex(0)
            setBuilderModules([
                { id: crypto.randomUUID(), title: 'Introduction', module_type: 'slides', video_url: '', video_source: 'youtube', is_unskippable: false, videos: [] }
            ])
            setCourseStep(1)
            setNewCourse({
                title: '',
                description: '',
                detailed_content: '',
                objectives: [],
                target_audience: '',
                instructors: [],
                type: 'video',
                is_library_item: false,
                category: 'General',
                visibility_type: 'public',
                cover_page_url: '',
                custom_settings: {
                    fontFamily: 'Inter',
                    themeColor: '#3b82f6',
                    fontSize: 'base'
                }
            })
            setCreationType(null)
            setNewModule({
                title: '',
                module_type: 'video',
                video_url: '',
                video_source: 'youtube',
                is_unskippable: false,
                add_quiz: false,
                videos: []
            })
            router.refresh()
        }
        setLoading(false)
    }

    async function handleAddModule(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedCourse) return
        setLoading(true)

        const { add_quiz, videos: moduleVideos, ...moduleToInsert } = newModule
        const { data: moduleData, error: error } = await supabase
            .from('course_modules')
            .insert([{
                ...moduleToInsert,
                course_id: selectedCourse.id,
                order_index: (selectedCourse.modules?.length || 0) + 1,
                videos: moduleVideos
            }])
            .select()
            .single()

        if (error) {
            alert('Error adding module: ' + error.message)
        } else {
            // If the user checked "Add Quiz", open the quiz creator automatically
            if (newModule.add_quiz && moduleData) {
                setConfiguringQuiz({ id: moduleData.id, title: moduleData.title, module_type: moduleData.module_type, videos: moduleData.videos })
            }
            setIsAddingModule(false)
            setModuleStep(1)
            setNewModule({
                title: '',
                module_type: 'video',
                video_url: '',
                video_source: 'youtube',
                is_unskippable: false,
                add_quiz: false,
                videos: []
            })
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDeleteCourse(courseId: string) {
        // 1. Optimistic Update
        const previousCourses = [...courses]
        setCourses(courses.filter(c => c.id !== courseId))

        try {
            setLoading(true)

            // 2. Call server-side action to bypass all RLS blocks
            const result = await deleteCourseAction(courseId)

            if (result.error) throw new Error(result.error)

            router.refresh()
        } catch (error: any) {
            console.error('STRICT DELETE ERROR:', error)
            alert('Failed to delete course: ' + (error.message || 'Unknown error'))
            // 3. Revert state on error
            setCourses(previousCourses)
        } finally {
            setLoading(false)
        }
    }


    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadProgress(0)

        const fileExt = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${fileName}`

        // Check file size (5GB limit)
        const MAX_SIZE = 5 * 1024 * 1024 * 1024
        if (file.size > MAX_SIZE) {
            alert('File too large. Maximum size is 5GB.')
            setUploading(false)
            return
        }

        try {
            // Try TUS upload first
            await uploadWithTUS(file, filePath)
        } catch (tusError) {
            console.warn('⚠️ TUS upload failed, using standard upload:', tusError)
            try {
                await uploadStandard(file, filePath)
            } catch (standardError: any) {
                console.error('❌ Both upload methods failed:', standardError)
                const isSizeError = standardError.message?.toLowerCase().includes('size') || standardError.message?.toLowerCase().includes('limit')
                const sizeMB = (file.size / 1024 / 1024).toFixed(1)

                let errorMsg = `Upload failed: ${standardError.message || 'Unknown error'}.`
                if (isSizeError) {
                    errorMsg = `🚨 FILE TOO LARGE: You tried to upload ${sizeMB}MB, but Supabase rejected it. \n\nIf you are on the FREE PLAN, Supabase limits files to 50MB. Please try a smaller video or check your plan.`
                }

                alert(errorMsg)
                setUploading(false)
            }
        }
    }

    async function uploadWithTUS(file: File, filePath: string) {
        return new Promise<void>(async (resolve, reject) => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                console.error('❌ TUS Upload Error: No active session found')
                reject(new Error('You must be logged in to upload videos.'))
                return
            }

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            const endpoint = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/upload/resumable`

            console.log('🎬 Initializing TUS upload:', {
                fileName: file.name,
                filePath,
                endpoint,
                hasToken: !!session?.access_token
            })

            const upload = new tus.Upload(file, {
                endpoint,
                retryDelays: [0, 1000, 3000],
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    'x-upsert': 'true',
                },
                metadata: {
                    bucketName: 'course-assets',
                    objectName: filePath,
                    contentType: file.type,
                },
                chunkSize: 5 * 1024 * 1024,
                removeFingerprintOnSuccess: true,
                onError: (error) => {
                    console.error('❌ TUS Error:', error)
                    if (error.message.includes('413')) {
                        reject(new Error('File too large for server limits.'))
                    } else if (error.message.includes('403')) {
                        reject(new Error('Permission denied. Please check your role.'))
                    } else {
                        reject(error)
                    }
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal) * 100
                    setUploadProgress(Math.round(percentage))
                },
                onSuccess: () => {
                    console.log('✅ TUS Upload complete')
                    const { data: { publicUrl } } = supabase.storage
                        .from('course-assets')
                        .getPublicUrl(filePath)

                    const videoItem = {
                        id: crypto.randomUUID(),
                        url: publicUrl,
                        title: file.name.split('.')[0],
                        source: 'storage'
                    }

                    setNewModule(prev => ({
                        ...prev,
                        videos: [...(prev.videos || []), videoItem]
                    }))
                    setUploading(false)
                    setUploadProgress(0)
                    resolve()
                },
            })

            try {
                const previousUploads = await upload.findPreviousUploads()
                if (previousUploads.length > 0) {
                    console.log('📂 Resuming upload...')
                    upload.resumeFromPreviousUpload(previousUploads[0])
                }
                upload.start()
            } catch (err) {
                reject(err)
            }
        })
    }

    async function uploadStandard(file: File, filePath: string) {
        console.log('📤 Starting standard upload:', {
            name: file.name,
            size: file.size,
            type: file.type,
            targetPath: filePath
        })
        setUploadProgress(50)

        const { data, error } = await supabase.storage
            .from('course-assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (error) {
            console.error('❌ Standard upload error:', error)
            throw error
        }

        setUploadProgress(100)
        console.log('✅ Standard upload complete:', data)

        const { data: { publicUrl } } = supabase.storage
            .from('course-assets')
            .getPublicUrl(filePath)

        const videoItem = {
            id: crypto.randomUUID(),
            url: publicUrl,
            title: file.name.split('.')[0],
            source: 'storage'
        }

        setNewModule(prev => ({
            ...prev,
            videos: [...(prev.videos || []), videoItem]
        }))
        setUploading(false)
        setUploadProgress(0)
    }

    return (
        <div className="space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {courses
                    .filter(course => !['ECT', 'CT', 'ECT Mastery', 'ECT Mastery: Electronic Coordination', 'CT: Practical Coordination Training'].includes(course.title))
                    .filter(course => {
                        if (!searchQuery) return true;
                        return course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
                    })
                    .map((course) => (
                        <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 hover:border-zinc-700 transition-all group overflow-hidden relative">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                        {course.type}
                                    </span>
                                    <h3 className="text-lg md:text-xl font-bold text-white pt-2">{course.title}</h3>
                                    <p className="text-zinc-500 text-xs md:text-sm font-medium line-clamp-2">{course.description}</p>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === course.id ? null : course.id)}
                                        className={`p-4 -m-2 rounded-2xl transition-all relative z-30 touch-manipulation ${activeMenuId === course.id ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-white hover:bg-zinc-800/50'}`}
                                        aria-label="Course Menu"
                                    >
                                        <MoreVertical className="w-6 h-6" />
                                    </button>

                                    {activeMenuId === course.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px] touch-none"
                                                onClick={() => setActiveMenuId(null)}
                                            />
                                            <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none">
                                                {enableAssignments && (
                                                    <button
                                                        onClick={() => {
                                                            setAssigningCourse({ id: course.id, title: course.title })
                                                            setActiveMenuId(null)
                                                        }}
                                                        className="w-full text-left px-6 py-5 text-sm font-black text-blue-500 hover:bg-blue-500/10 active:bg-blue-500/20 transition-all flex items-center gap-4 uppercase tracking-[0.15em] touch-manipulation border-b border-zinc-800"
                                                    >
                                                        <Users className="w-5 h-5 flex-shrink-0" />
                                                        <span>Assign to ATCOs</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setConfirmDeleteId(course.id)
                                                        setActiveMenuId(null)
                                                    }}
                                                    className="w-full text-left px-6 py-5 text-sm font-black text-red-500 hover:bg-red-500/10 active:bg-red-500/20 transition-all flex items-center gap-4 uppercase tracking-[0.15em] touch-manipulation"
                                                >
                                                    <Trash2 className="w-5 h-5 flex-shrink-0" />
                                                    <span>Delete Course</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                                {course.modules?.map((module, idx) => (
                                    <div key={module.id} className="flex items-center justify-between p-3 md:p-4 bg-zinc-950/50 rounded-xl md:rounded-2xl border border-zinc-800/50">
                                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 text-[9px] md:text-[10px] font-black flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                                {module.module_type === 'video' ? (
                                                    <Play className="w-3 h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                                                ) : module.module_type === 'slides' ? (
                                                    <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 flex-shrink-0" />
                                                ) : (
                                                    <HelpCircle className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />
                                                )}
                                                <span className="text-xs md:text-sm font-bold text-zinc-300 truncate">{module.title}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                            {(module.module_type === 'quiz' || module.module_type === 'video' || module.module_type === 'slides') && (
                                                <button
                                                    onClick={() => {
                                                        if (module.module_type === 'slides') {
                                                            setEditingSlides({ id: module.id, title: module.title })
                                                        } else {
                                                            setConfiguringQuiz({
                                                                id: module.id,
                                                                title: module.title,
                                                                module_type: module.module_type,
                                                                videos: module.videos
                                                            })
                                                        }
                                                    }}
                                                    className="p-1.5 md:p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5"
                                                >
                                                    <Settings className="w-3 h-3" />
                                                    <span className="hidden xs:inline text-[9px] font-black uppercase tracking-widest">Config</span>
                                                </button>
                                            )}
                                            <span className="hidden sm:inline text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{module.module_type}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!course.modules || course.modules.length === 0) && (
                                    <div className="py-6 md:py-8 text-center bg-zinc-950/20 rounded-xl md:rounded-2xl border border-dashed border-zinc-800/50">
                                        <p className="text-zinc-600 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">No modules</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setSelectedCourse(course)
                                        setIsAddingModule(true)
                                    }}
                                    className="flex-[3] bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 active:bg-zinc-800 active:scale-[0.98] py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 touch-manipulation min-h-[52px]"
                                >
                                    <Plus className="w-5 h-5 text-blue-500" />
                                    Add Module
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (confirmDeleteId === course.id) {
                                            handleDeleteCourse(course.id)
                                            setConfirmDeleteId(null)
                                        } else {
                                            setConfirmDeleteId(course.id)
                                            // Reset after 4 seconds if not confirmed
                                            setTimeout(() => setConfirmDeleteId(prev => prev === course.id ? null : prev), 4000)
                                        }
                                    }}
                                    className={`flex-[1.2] flex items-center justify-center gap-2 py-4 rounded-2xl transition-all duration-300 touch-manipulation z-20 overflow-hidden relative min-h-[52px] ${confirmDeleteId === course.id ? 'bg-red-600 text-white border-red-500 shadow-xl shadow-red-500/20' : 'bg-zinc-950 border border-zinc-800 text-zinc-700 hover:text-red-500 active:scale-[0.95]'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label="Delete Course"
                                >
                                    <Trash2 className={`w-5 h-5 transition-transform duration-300 ${confirmDeleteId === course.id ? 'scale-90 opacity-70' : 'opacity-100'} ${loading && confirmDeleteId === course.id ? 'animate-pulse' : ''}`} />
                                    {confirmDeleteId === course.id && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-right-2 duration-200">
                                            {loading ? '...' : 'Delete'}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Add Course Modal */}
            {isAddingCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black sm:bg-black/80 backdrop-blur-xl" onClick={() => setIsAddingCourse(false)} />
                    <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-zinc-950 sm:bg-zinc-900 border-x-0 sm:border border-zinc-800 sm:rounded-[2.5rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
                        <header className="p-6 sm:p-10 pb-4 flex justify-between items-center sm:block border-b border-white/5 sm:border-0 pt-[env(safe-area-inset-top,1.5rem)] sm:pt-10">
                            <div className="sm:mb-2">
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                    {!creationType && "Select Creation Type"}
                                    {creationType && courseStep === 1 && "Course Identity"}
                                    {creationType === 'professional' && courseStep === 2 && "Cover Aesthetics"}
                                    {creationType === 'professional' && courseStep === 3 && "Academic Profile"}
                                    {creationType === 'professional' && courseStep === 4 && "Evolutionary Builder"}
                                    {creationType === 'professional' && courseStep === 5 && "Final Governance"}
                                    {creationType === 'archive' && courseStep === 2 && "Module Payload"}
                                    {creationType === 'archive' && courseStep === 3 && "Governance"}
                                </h3>
                                <p className="text-zinc-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">
                                    {!creationType ? "Step 1: Choose Path" : `Step ${courseStep} of ${creationType === 'professional' ? 5 : 3}`}
                                </p>
                            </div>
                            <button onClick={() => { setIsAddingCourse(false); setCreationType(null); setCourseStep(1); }} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all sm:absolute sm:top-10 sm:right-10">
                                <X className="w-6 h-6 text-zinc-600" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-8 sm:px-10 pb-10 space-y-6 no-scrollbar">
                            {!creationType ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 animate-in fade-in zoom-in-95 duration-300">
                                    <button
                                        onClick={() => setCreationType('professional')}
                                        className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-600/5 transition-all"
                                    >
                                        <div className="w-20 h-20 bg-blue-600/10 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-10 h-10 text-blue-500" />
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Course</h4>
                                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Comprehensive educational program featuring videos, slides, and integrated assessments.</p>
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-6 h-6 text-blue-500" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setCreationType('archive')
                                            setNewCourse(prev => ({ ...prev, type: 'quiz' }))
                                        }}
                                        className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center hover:border-zinc-500 hover:bg-zinc-800 transition-all"
                                    >
                                        <div className="w-20 h-20 bg-zinc-800 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <HelpCircle className="w-10 h-10 text-zinc-600" />
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Quiz</h4>
                                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Standalone assessment or competency check for rapid ATCO evaluation.</p>
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-6 h-6 text-zinc-400" />
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {courseStep === 1 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-150">
                                            <div className="space-y-2">
                                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Course Name</label>
                                                <input
                                                    required
                                                    autoFocus
                                                    value={newCourse.title}
                                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                                    placeholder="e.g. Advanced Approach"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Universal Category</label>
                                                <select
                                                    value={newCourse.category}
                                                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner appearance-none"
                                                >
                                                    <option>General</option>
                                                    <option>Radar Operations</option>
                                                    <option>Tower & Ground</option>
                                                    <option>Emergency Procedures</option>
                                                    <option>Advanced Approach</option>
                                                    <option>QUIZ: Private</option>
                                                </select>
                                            </div>

                                            {creationType === 'professional' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Library Description</label>
                                                    <textarea
                                                        required
                                                        value={newCourse.description}
                                                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-blue-500 min-h-[120px] resize-none shadow-inner"
                                                        placeholder="Outline what the ATCO will learn..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {creationType === 'professional' && courseStep === 2 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-150">
                                            <div className="bg-zinc-950/50 border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center gap-6">
                                                <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center">
                                                    <ImageIcon className="w-10 h-10 text-blue-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">Course Cover</h4>
                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-[240px]">This image will represent the course in the Universal Academy.</p>
                                                </div>

                                                <div className="w-full space-y-4">
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]
                                                                if (!file) return
                                                                setUploading(true)
                                                                const path = `covers/${crypto.randomUUID()}-${file.name}`
                                                                const { data, error } = await supabase.storage.from('course-assets').upload(path, file)
                                                                if (data) {
                                                                    const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(path)
                                                                    setNewCourse({ ...newCourse, cover_page_url: publicUrl })
                                                                }
                                                                setUploading(false)
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className={`py-12 border-2 border-dashed rounded-3xl flex flex-col items-center group-hover:border-blue-500 transition-all ${newCourse.cover_page_url ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950'}`}>
                                                            {newCourse.cover_page_url ? (
                                                                <div className="flex flex-col items-center gap-4">
                                                                    <div className="w-40 aspect-video rounded-xl overflow-hidden shadow-2xl">
                                                                        <img src={newCourse.cover_page_url} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Image Uploaded</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Plus className="w-8 h-8 text-zinc-700 mb-2" />
                                                                    <span className="text-[9px] font-black uppercase text-zinc-500">Upload Visual Cover</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {creationType === 'professional' && courseStep === 3 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-150 pb-20">
                                            <div className="flex justify-between items-center bg-blue-600/5 p-4 rounded-2xl border border-blue-500/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                                        <Eye className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-blue-400">Live Preview Mode</span>
                                                </div>
                                                <button
                                                    onClick={() => setIsPreviewOpen(true)}
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                                                >
                                                    View as ATCO
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Font Theme</label>
                                                        <select
                                                            value={newCourse.custom_settings.fontFamily}
                                                            onChange={(e) => setNewCourse({
                                                                ...newCourse,
                                                                custom_settings: { ...newCourse.custom_settings, fontFamily: e.target.value }
                                                            })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Inter">Modern (Inter)</option>
                                                            <option value="IBM Plex Sans">Technical (IBM Plex)</option>
                                                            <option value="Outfit">Clean (Outfit)</option>
                                                            <option value="serif">Official (Serif)</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Emphasis Color</label>
                                                        <div className="flex gap-2">
                                                            {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => setNewCourse({
                                                                        ...newCourse,
                                                                        custom_settings: { ...newCourse.custom_settings, themeColor: c }
                                                                    })}
                                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${newCourse.custom_settings.themeColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                                                        <Bold className="w-3 h-3" /> Detailed Bio / Instructions
                                                    </label>
                                                    <textarea
                                                        value={newCourse.detailed_content}
                                                        onChange={(e) => setNewCourse({ ...newCourse, detailed_content: e.target.value })}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-blue-500 min-h-[120px] resize-none"
                                                        placeholder="Write a formal introduction to the course..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                                                        <List className="w-3 h-3" /> Learning Objectives (One per line)
                                                    </label>
                                                    <textarea
                                                        value={newCourse.objectives.join('\n')}
                                                        onChange={(e) => setNewCourse({ ...newCourse, objectives: e.target.value.split('\n') })}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                                                        placeholder="Explain radar approach basics...&#10;Master emergency vectoring...&#10;Verify separation standards..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                                                        <Users className="w-3 h-3" /> Target Audience
                                                    </label>
                                                    <textarea
                                                        value={newCourse.target_audience}
                                                        onChange={(e) => setNewCourse({ ...newCourse, target_audience: e.target.value })}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
                                                        placeholder="e.g. Experienced ATCOs, Training Officers, or Tower Ground Controllers..."
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Delivered By / Faculty</label>
                                                        <button
                                                            onClick={() => setNewCourse({
                                                                ...newCourse,
                                                                instructors: [...newCourse.instructors, { name: '', role: '' }]
                                                            })}
                                                            className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:text-blue-400"
                                                        >
                                                            <UserPlus className="w-3 h-3" /> Add Member
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {newCourse.instructors.map((inst, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                                                                <input
                                                                    placeholder="Name"
                                                                    value={inst.name}
                                                                    onChange={(e) => {
                                                                        const copy = [...newCourse.instructors]
                                                                        copy[idx].name = e.target.value
                                                                        setNewCourse({ ...newCourse, instructors: copy })
                                                                    }}
                                                                    className="flex-1 bg-transparent border-none text-xs font-bold text-white focus:outline-none placeholder:text-zinc-700"
                                                                />
                                                                <input
                                                                    placeholder="Role"
                                                                    value={inst.role}
                                                                    onChange={(e) => {
                                                                        const copy = [...newCourse.instructors]
                                                                        copy[idx].role = e.target.value
                                                                        setNewCourse({ ...newCourse, instructors: copy })
                                                                    }}
                                                                    className="flex-1 bg-transparent border-none text-xs text-zinc-500 font-medium focus:outline-none placeholder:text-zinc-800"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const copy = [...newCourse.instructors]
                                                                        copy.splice(idx, 1)
                                                                        setNewCourse({ ...newCourse, instructors: copy })
                                                                    }}
                                                                    className="p-1 text-zinc-800 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {creationType === 'professional' && courseStep === 4 && (
                                        <div className="flex bg-zinc-950 -m-6 sm:-m-10 h-[65vh] sm:h-[70vh] divide-x divide-zinc-800/50">
                                            {/* Left Sidebar: Module Stack */}
                                            <div className="w-20 sm:w-64 flex flex-col overflow-y-auto no-scrollbar bg-zinc-950/50">
                                                <div className="p-4 sm:p-6 space-y-3">
                                                    {builderModules.map((m, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveModuleIndex(idx)}
                                                            className={`w-full group relative aspect-video sm:aspect-auto sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex flex-col items-center sm:items-start justify-center text-center sm:text-left ${activeModuleIndex === idx ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black ${activeModuleIndex === idx ? 'bg-white text-blue-600' : 'bg-zinc-800 text-zinc-600'}`}>
                                                                    {idx + 1}
                                                                </span>
                                                                <p className={`hidden sm:block text-[11px] font-black uppercase tracking-tighter truncate ${activeModuleIndex === idx ? 'text-white' : 'text-zinc-500'}`}>
                                                                    {m.title || 'Draft Concept'}
                                                                </p>
                                                            </div>
                                                            {idx > 0 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        const copy = builderModules.filter((_, i) => i !== idx)
                                                                        setBuilderModules(copy)
                                                                        setActiveModuleIndex(Math.max(0, idx - 1))
                                                                    }}
                                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            setBuilderModules([...builderModules, { id: crypto.randomUUID(), title: 'New Module', module_type: 'slides', video_url: '', video_source: 'youtube', is_unskippable: false, videos: [] }])
                                                            setActiveModuleIndex(builderModules.length)
                                                        }}
                                                        className="w-full aspect-video sm:aspect-auto sm:p-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-zinc-800/50 flex items-center justify-center gap-2 text-zinc-700 hover:border-blue-500/50 hover:text-blue-500 transition-all active:scale-95"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Add Module</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Center Stage: Interactive Workspace */}
                                            <div className="flex-1 overflow-y-auto no-scrollbar bg-black/20 p-6 sm:p-12 relative">
                                                <div className="max-w-3xl mx-auto space-y-12">
                                                    {/* Blueprint Type Selection */}
                                                    <div className="flex justify-center">
                                                        <div className="inline-flex p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl">
                                                            {[
                                                                { id: 'slides', icon: LayoutDashboard, label: 'Slides' },
                                                                { id: 'video', icon: Video, label: 'Visual' },
                                                                { id: 'quiz', icon: HelpCircle, label: 'Exam' }
                                                            ].map((type) => (
                                                                <button
                                                                    key={type.id}
                                                                    onClick={() => {
                                                                        const copy = [...builderModules]
                                                                        copy[activeModuleIndex].module_type = type.id
                                                                        setBuilderModules(copy)
                                                                    }}
                                                                    className={`px-6 py-3 rounded-xl flex items-center gap-3 transition-all ${builderModules[activeModuleIndex].module_type === type.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                                >
                                                                    <type.icon className="w-4 h-4" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{type.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Configuration Surface */}
                                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Blueprint Header</label>
                                                            <input
                                                                value={builderModules[activeModuleIndex].title}
                                                                onChange={(e) => {
                                                                    const copy = [...builderModules]
                                                                    copy[activeModuleIndex].title = e.target.value
                                                                    setBuilderModules(copy)
                                                                }}
                                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-xl font-black text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                                                placeholder="e.g. Introduction to Vectoring"
                                                                autoFocus
                                                            />
                                                        </div>

                                                        {builderModules[activeModuleIndex].module_type === 'video' ? (
                                                            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
                                                                <div className="flex justify-between items-center ml-1">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Visual Sequencer</label>
                                                                    <span className="text-[10px] font-black text-blue-500 uppercase">{builderModules[activeModuleIndex].videos?.length || 0} Assets</span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {(builderModules[activeModuleIndex].videos || []).map((vid: any, vIdx: number) => (
                                                                        <div key={vIdx} className="flex gap-4 items-center bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                                                                            <span className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-700">{vIdx + 1}</span>
                                                                            <p className="flex-1 text-xs font-bold text-white truncate">{vid.title}</p>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const copy = [...builderModules]
                                                                                    copy[activeModuleIndex].videos = copy[activeModuleIndex].videos.filter((_: any, i: number) => i !== vIdx)
                                                                                    setBuilderModules(copy)
                                                                                }}
                                                                                className="p-2 text-zinc-800 hover:text-red-500"
                                                                            >
                                                                                <Trash className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <button
                                                                            onClick={() => {
                                                                                const url = prompt('Enter YouTube/Vimeo URL')
                                                                                if (url) {
                                                                                    const source = url.includes('vimeo') ? 'vimeo' : 'youtube'
                                                                                    const copy = [...builderModules]
                                                                                    if (!copy[activeModuleIndex].videos) copy[activeModuleIndex].videos = []
                                                                                    copy[activeModuleIndex].videos.push({ id: crypto.randomUUID(), url, title: 'External Media', source })
                                                                                    setBuilderModules(copy)
                                                                                }
                                                                            }}
                                                                            className="py-10 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-700 hover:border-blue-500/50 hover:text-blue-500 transition-all bg-zinc-950/20"
                                                                        >
                                                                            <Play className="w-6 h-6 mb-2" />
                                                                            <span className="text-[9px] font-black uppercase tracking-widest">Link Stream</span>
                                                                        </button>
                                                                        <div className="relative group">
                                                                            <input
                                                                                type="file"
                                                                                accept="video/*"
                                                                                onChange={handleFileUpload}
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                            />
                                                                            <div className="py-10 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-700 group-hover:border-blue-500/50 group-hover:text-blue-500 transition-all bg-zinc-950/20">
                                                                                <Plus className="w-6 h-6 mb-2" />
                                                                                <span className="text-[9px] font-black uppercase tracking-widest">Upload Disk</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : builderModules[activeModuleIndex].module_type === 'slides' ? (
                                                            <div className="bg-blue-600/5 border border-blue-500/20 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
                                                                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center">
                                                                    <LayoutDashboard className="w-10 h-10 text-blue-500" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">Interactive Presentation</h4>
                                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Design multi-slide concepts with rich text, media, and dynamic layouts.</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setEditingSlides({ id: builderModules[activeModuleIndex].id, title: builderModules[activeModuleIndex].title })}
                                                                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-3"
                                                                >
                                                                    <Sparkles className="w-4 h-4" />
                                                                    Open Interactive Designer
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-purple-600/5 border border-purple-500/20 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
                                                                <div className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center">
                                                                    <HelpCircle className="w-10 h-10 text-purple-500" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">Knowledge Checkpoint</h4>
                                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Design standalone assessments or mid-course interactive checkpoints.</p>
                                                                </div>
                                                                <button
                                                                    className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 hover:bg-purple-500 transition-all active:scale-95 flex items-center gap-3 cursor-not-allowed opacity-50"
                                                                >
                                                                    <HelpCircle className="w-4 h-4" />
                                                                    Design Post-Module Exam
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {((creationType === 'professional' && courseStep === 5) || (creationType === 'archive' && courseStep === 2)) && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-150">
                                            <div className="bg-zinc-950/50 border border-zinc-800 p-8 rounded-[2rem] space-y-4">
                                                <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">Strict Operation Flow</p>
                                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Cannot skip forward</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewModule({ ...newModule, is_unskippable: !newModule.is_unskippable })}
                                                        className={`w-12 h-6 rounded-full transition-all relative ${newModule.is_unskippable ? 'bg-blue-600' : 'bg-zinc-800'}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newModule.is_unskippable ? 'left-7' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl text-center">
                                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] leading-relaxed">
                                                    Ready to publish to universal academy
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <footer className="p-8 sm:p-10 border-t border-zinc-800 bg-zinc-950/50 flex gap-4">
                            {creationType && (
                                <button
                                    onClick={() => {
                                        if (courseStep === 1) setCreationType(null)
                                        else setCourseStep(prev => prev - 1)
                                    }}
                                    className="px-8 py-5 bg-zinc-900 text-zinc-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                disabled={loading || uploading || (!!creationType && courseStep === 1 && !newCourse.title)}
                                onClick={(e) => {
                                    if (!creationType) return
                                    const maxSteps = creationType === 'professional' ? 5 : 3
                                    if (courseStep < maxSteps) {
                                        setCourseStep(prev => prev + 1)
                                    } else {
                                        handleAddCourse(e)
                                    }
                                }}
                                className={`flex-1 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-3 ${!creationType ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800' : 'bg-white text-black hover:bg-zinc-200'} active:scale-[0.98] disabled:opacity-50`}
                            >
                                {loading ? 'Processing...' : (!creationType ? 'Select Type Above' : (courseStep < (creationType === 'professional' ? 5 : 3) ? (creationType === 'professional' && courseStep === 3 ? 'Launch Course Builder' : 'Continue to Next Phase') : 'Publish & Deploy'))}
                            </button>
                        </footer>
                    </div>

                    {/* Preview Portal */}
                    {isPreviewOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
                            <div className="relative w-full h-full flex flex-col">
                                <header className="bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">ATCO Experience Preview</h3>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight italic">This is how your training will appear in the library</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsPreviewOpen(false)}
                                        className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-2xl transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </header>
                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                    <CourseDetailsPreview course={newCourse as any} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Module Modal */}
            {isAddingModule && selectedCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAddingModule(false)} />
                    <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${(moduleStep / 3) * 100}%` }}
                            />
                        </div>

                        <header className="p-8 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase">
                                    {moduleStep === 1 && "Module Type"}
                                    {moduleStep === 2 && "Content Setup"}
                                    {moduleStep === 3 && "Preferences"}
                                </h3>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">To: {selectedCourse.title}</p>
                            </div>
                            <button onClick={() => setIsAddingModule(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </header>

                        <div className="flex-1 px-8 pb-10 space-y-6 overflow-y-auto no-scrollbar max-h-[60vh]">
                            {moduleStep === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setNewModule({ ...newModule, module_type: 'video' })}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newModule.module_type === 'video' ? 'border-blue-600 bg-blue-600/10 text-blue-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <Video className="w-8 h-8" />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Video</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewModule({ ...newModule, module_type: 'quiz' })}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newModule.module_type === 'quiz' ? 'border-purple-600 bg-purple-600/10 text-purple-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <HelpCircle className="w-8 h-8" />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Quiz</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewModule({ ...newModule, module_type: 'slides' })}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newModule.module_type === 'slides' ? 'border-emerald-600 bg-emerald-600/10 text-emerald-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <LayoutDashboard className="w-8 h-8" />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Slides</span>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Module Title</label>
                                        <input
                                            required
                                            value={newModule.title}
                                            onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. Introduction to Sector 5"
                                        />
                                    </div>
                                </div>
                            )}

                            {moduleStep === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    {newModule.module_type === 'video' ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Playlist Content</label>
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase">{newModule.videos.length} Added</span>
                                            </div>

                                            <div className="space-y-2">
                                                {newModule.videos.map((vid, vIdx) => (
                                                    <div key={vid.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[9px] font-black text-zinc-600">{vIdx + 1}</div>
                                                            <p className="text-[11px] font-bold text-white truncate">{vid.title}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewModule({ ...newModule, videos: newModule.videos.filter(v => v.id !== vid.id) })}
                                                            className="p-1.5 text-zinc-800 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={handleFileUpload}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="py-4 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center bg-zinc-900/50">
                                                            {uploading ? (
                                                                <div className="w-full px-4 flex flex-col items-center gap-1">
                                                                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                                    <span className="text-[8px] font-black text-blue-500">{uploadProgress}%</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-black uppercase text-zinc-600">+ Upload</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const url = prompt('Enter YouTube/Vimeo URL')
                                                            if (url) {
                                                                const source = url.includes('vimeo') ? 'vimeo' : 'youtube'
                                                                setNewModule({
                                                                    ...newModule,
                                                                    videos: [...newModule.videos, { id: crypto.randomUUID(), url, title: 'External Video', source }]
                                                                })
                                                            }
                                                        }}
                                                        className="py-4 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center bg-zinc-900/50"
                                                    >
                                                        <span className="text-[10px] font-black uppercase text-zinc-600">+ Link URL</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                            <HelpCircle className="w-12 h-12 text-blue-500/50" />
                                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Configure your quiz structure in the next step</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {moduleStep === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                            <div>
                                                <p className="text-sm font-bold text-white">Unskippable</p>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase">Block seeking</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewModule({ ...newModule, is_unskippable: !newModule.is_unskippable })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${newModule.is_unskippable ? 'bg-blue-600' : 'bg-zinc-800'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newModule.is_unskippable ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-5 bg-purple-600/5 border border-purple-500/20 rounded-2xl">
                                            <div>
                                                <p className="text-sm font-bold text-white">Integrate Quiz</p>
                                                <p className="text-[10px] text-purple-500/60 font-bold uppercase">Add questions</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewModule({ ...newModule, add_quiz: !newModule.add_quiz })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${newModule.add_quiz ? 'bg-purple-600' : 'bg-zinc-800'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newModule.add_quiz ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer className="p-8 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
                            {moduleStep > 1 && (
                                <button
                                    onClick={() => setModuleStep(prev => prev - 1)}
                                    className="px-6 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                >
                                    Back
                                </button>
                            )}
                            {moduleStep < 3 ? (
                                <button
                                    onClick={() => {
                                        if (moduleStep === 1 && !newModule.title) {
                                            alert('Please enter a module title');
                                            return;
                                        }
                                        setModuleStep(prev => prev + 1);
                                    }}
                                    className="flex-1 bg-white text-zinc-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddModule}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                >
                                    {loading ? 'Adding...' : 'Add Module to Track'}
                                </button>
                            )}
                        </footer>
                    </div>
                </div>
            )}

            <QuizCreator
                isOpen={!!configuringQuiz}
                onClose={() => setConfiguringQuiz(null)}
                moduleId={configuringQuiz?.id || ''}
                moduleTitle={configuringQuiz?.title || ''}
                moduleType={configuringQuiz?.module_type || ''}
                moduleVideos={configuringQuiz?.videos}
            />

            {assigningCourse && (
                <CourseAssignment
                    isOpen={true}
                    onClose={() => setAssigningCourse(null)}
                    courseId={assigningCourse.id}
                    courseTitle={assigningCourse.title}
                />
            )}

            <SlideEditor
                isOpen={!!editingSlides}
                onClose={() => setEditingSlides(null)}
                moduleId={editingSlides?.id || ''}
                moduleTitle={editingSlides?.title || ''}
            />

        </div>
    )
}

'use client'

import { useState } from 'react'
import { Plus, Video, HelpCircle, FileText, ChevronRight, Play, CheckCircle2, MoreVertical, Trash2, Settings, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import QuizCreator from './QuizCreator'

interface Course {
    id: string
    title: string
    description: string
    type: string
    modules?: Module[]
}

interface Module {
    id: string
    title: string
    module_type: 'video' | 'quiz' | 'document' | 'live'
    order_index: number
    video_url?: string
    video_source?: 'youtube' | 'vimeo' | 'storage'
    is_unskippable?: boolean
}

interface CourseManagerProps {
    initialCourses: Course[]
}

export default function CourseManager({ initialCourses }: CourseManagerProps) {
    const router = useRouter()
    const [courses, setCourses] = useState(initialCourses)
    const [isAddingCourse, setIsAddingCourse] = useState(false)
    const [newCourse, setNewCourse] = useState({ title: '', description: '', type: 'course' })
    const [loading, setLoading] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [isAddingModule, setIsAddingModule] = useState(false)
    const [newModule, setNewModule] = useState({
        title: '',
        module_type: 'video',
        video_url: '',
        video_source: 'youtube' as 'youtube' | 'vimeo' | 'storage',
        is_unskippable: false,
        add_quiz: false
    })
    const [uploading, setUploading] = useState(false)
    const [configuringQuiz, setConfiguringQuiz] = useState<{ id: string, title: string, module_type: string } | null>(null)

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
                description: newCourse.description,
                type: newCourse.type,
                created_by: user?.id
            }])
            .select()
            .single()

        if (courseError) {
            alert('Error creating course: ' + courseError.message)
            setLoading(false)
            return
        }

        // 2. Create the initial module based on type
        const { data: moduleData, error: moduleError } = await supabase
            .from('course_modules')
            .insert([{
                course_id: courseData.id,
                title: newCourse.title, // Primary module has same name usually
                module_type: newCourse.type === 'video' ? 'video' : newCourse.type === 'live' ? 'live' : 'quiz',
                video_url: newModule.video_url,
                video_source: newModule.video_source,
                is_unskippable: newModule.is_unskippable,
                order_index: 1
            }])
            .select()
            .single()

        if (moduleError) {
            alert('Error creating initial module: ' + moduleError.message)
        } else {
            // 3. If "Integrate Quiz" was checked OR type is Quiz, open quiz creator
            if ((newModule.add_quiz || newCourse.type === 'quiz') && moduleData) {
                setConfiguringQuiz({ id: moduleData.id, title: moduleData.title, module_type: moduleData.module_type })
            }
            setIsAddingCourse(false)
            setNewCourse({ title: '', description: '', type: 'video' })
            setNewModule({
                title: '',
                module_type: 'video',
                video_url: '',
                video_source: 'youtube',
                is_unskippable: false,
                add_quiz: false
            })
            router.refresh()
        }
        setLoading(false)
    }

    async function handleAddModule(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedCourse) return
        setLoading(true)

        const { data: moduleData, error } = await supabase
            .from('course_modules')
            .insert([{
                ...newModule,
                course_id: selectedCourse.id,
                order_index: (selectedCourse.modules?.length || 0) + 1
            }])
            .select()
            .single()

        if (error) {
            alert('Error adding module: ' + error.message)
        } else {
            // If the user checked "Add Quiz", open the quiz creator automatically
            if (newModule.add_quiz && moduleData) {
                setConfiguringQuiz({ id: moduleData.id, title: moduleData.title, module_type: moduleData.module_type })
            }
            setIsAddingModule(false)
            setNewModule({
                title: '',
                module_type: 'video',
                video_url: '',
                video_source: 'youtube',
                is_unskippable: false,
                add_quiz: false
            })
            router.refresh()
        }
        setLoading(false)
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
            .from('course-assets')
            .upload(filePath, file)

        if (uploadError) {
            alert('Upload failed: ' + uploadError.message)
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('course-assets')
                .getPublicUrl(filePath)

            setNewModule({ ...newModule, video_url: publicUrl, video_source: 'storage' })
        }
        setUploading(false)
    }

    return (
        <div className="space-y-8">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">COURSE CATALOG</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Manage official course materials, syllabus, and COC exams.</p>
                </div>
                <button
                    onClick={() => setIsAddingCourse(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 xl:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Course
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.filter(course => !['ECT', 'CT', 'ECT Mastery', 'ECT Mastery: Electronic Coordination', 'CT: Practical Coordination Training'].includes(course.title)).map((course) => (
                    <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 hover:border-zinc-700 transition-all group overflow-hidden relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                    {course.type}
                                </span>
                                <h3 className="text-xl font-bold text-white pt-2">{course.title}</h3>
                                <p className="text-zinc-500 text-sm font-medium line-clamp-2">{course.description}</p>
                            </div>
                            <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-8">
                            {course.modules?.map((module, idx) => (
                                <div key={module.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 text-[10px] font-black">
                                            {idx + 1}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {module.module_type === 'video' ? <Play className="w-4 h-4 text-blue-500" /> : <HelpCircle className="w-4 h-4 text-purple-500" />}
                                            <span className="text-sm font-bold text-zinc-300">{module.title}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {module.module_type === 'quiz' && (
                                            <button
                                                onClick={() => setConfiguringQuiz({ id: module.id, title: module.title, module_type: module.module_type })}
                                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2"
                                            >
                                                <Settings className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Configure</span>
                                            </button>
                                        )}
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{module.module_type}</span>
                                    </div>
                                </div>
                            ))}
                            {(!course.modules || course.modules.length === 0) && (
                                <div className="py-8 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800/50">
                                    <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest">No modules added yet</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSelectedCourse(course)
                                    setIsAddingModule(true)
                                }}
                                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Module
                            </button>
                            <button className="aspect-square bg-zinc-950 border border-zinc-800 text-zinc-700 hover:text-red-500 hover:border-red-500/30 p-3 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Course Modal */}
            {isAddingCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black sm:bg-black/80 backdrop-blur-xl" onClick={() => setIsAddingCourse(false)} />
                    <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-zinc-950 sm:bg-zinc-900 border-x-0 sm:border border-zinc-800 sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                        <header className="mb-8 flex justify-between items-center sm:block">
                            <div className="sm:mb-2">
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">NEW COURSE / EXAM</h3>
                                <p className="text-zinc-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">Initialize learning curriculum</p>
                            </div>
                            <button onClick={() => setIsAddingCourse(false)} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all sm:absolute sm:top-8 sm:right-8">
                                <X className="w-6 h-6 text-zinc-600" />
                            </button>
                        </header>

                        <form onSubmit={handleAddCourse} className="flex-1 sm:flex-initial space-y-6">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Course Name</label>
                                    <input
                                        required
                                        autoFocus
                                        value={newCourse.title}
                                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                        placeholder="e.g. Advanced Approach"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'video', label: 'Video', icon: Video },
                                        { id: 'quiz', label: 'Quiz', icon: HelpCircle },
                                        { id: 'live', label: 'Live', icon: Video }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setNewCourse({ ...newCourse, type: type.id })}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newCourse.type === type.id ? 'border-blue-600 bg-blue-600/10 text-blue-100' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <type.icon className="w-8 h-8" />
                                            <span className="text-[11px] font-black uppercase tracking-widest">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description / Objectives</label>
                                    <textarea
                                        required
                                        value={newCourse.description}
                                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-none shadow-inner"
                                        placeholder="Outline what the ATCO will learn..."
                                    />
                                </div>

                                {/* Dynamic Customization based on Type (Pictures 3, 4, 5) */}
                                {newCourse.type === 'video' && (
                                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Video Source</label>
                                            <select
                                                value={newModule.video_source}
                                                onChange={(e) => setNewModule({ ...newModule, video_source: e.target.value as any, video_url: '' })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 appearance-none"
                                            >
                                                <option value="youtube">YouTube</option>
                                                <option value="vimeo">Vimeo</option>
                                                <option value="storage">Upload from Device (Camera Roll)</option>
                                            </select>
                                        </div>

                                        {newModule.video_source === 'storage' ? (
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="py-10 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center bg-zinc-900/50 group-hover:border-blue-500/50 transition-all">
                                                    {uploading ? (
                                                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                    ) : newModule.video_url ? (
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                                    ) : (
                                                        <>
                                                            <Video className="w-8 h-8 text-zinc-700 mb-2" />
                                                            <span className="text-[10px] font-black uppercase text-zinc-500">Pick from Camera Roll</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">URL / Source Link</label>
                                                <input
                                                    required
                                                    value={newModule.video_url}
                                                    onChange={(e) => setNewModule({ ...newModule, video_url: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                            <div>
                                                <p className="text-xs font-bold text-white">Unskippable Content</p>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Block forward seeking</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewModule({ ...newModule, is_unskippable: !newModule.is_unskippable })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${newModule.is_unskippable ? 'bg-blue-600' : 'bg-zinc-800'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newModule.is_unskippable ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-purple-600/5 border border-purple-500/20 rounded-2xl">
                                            <div>
                                                <p className="text-xs font-bold text-white">Integrate Interactive Quiz</p>
                                                <p className="text-[10px] text-purple-500/60 font-bold uppercase tracking-tight">Add quiz after video</p>
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
                                )}

                                {newCourse.type === 'live' && (
                                    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Classroom URL (Zoom/Teams)</label>
                                            <input
                                                required
                                                value={newModule.video_url}
                                                onChange={(e) => setNewModule({ ...newModule, video_url: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                                                placeholder="https://zoom.us/j/..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 sm:pt-0">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Deploy Curriculum
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCourse(false)}
                                    className="sm:hidden w-full text-zinc-500 font-bold py-6 text-sm uppercase tracking-widest"
                                >
                                    Go Back
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Module Modal */}
            {isAddingModule && selectedCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAddingModule(false)} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">ADD MODULE</h3>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">To: {selectedCourse.title}</p>
                        </div>
                        <form onSubmit={handleAddModule} className="space-y-6">
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setNewModule({ ...newModule, module_type: 'video' })}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newModule.module_type === 'video' ? 'border-blue-600 bg-blue-600/10 text-blue-100' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <Video className="w-8 h-8" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Video</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewModule({ ...newModule, module_type: 'quiz' })}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newModule.module_type === 'quiz' ? 'border-purple-600 bg-purple-600/10 text-purple-100' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <HelpCircle className="w-8 h-8" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Quiz</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewModule({ ...newModule, module_type: 'live' })}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${newModule.module_type === 'live' ? 'border-emerald-600 bg-emerald-600/10 text-emerald-100' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <Video className="w-8 h-8" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Live</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Module Title</label>
                                <input
                                    required
                                    value={newModule.title}
                                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="e.g. Introduction to Sequencing"
                                />
                            </div>

                            {newModule.module_type === 'video' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Video Source</label>
                                        <select
                                            value={newModule.video_source}
                                            onChange={(e) => setNewModule({ ...newModule, video_source: e.target.value as any, video_url: '' })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                        >
                                            <option value="youtube">YouTube</option>
                                            <option value="vimeo">Vimeo</option>
                                            <option value="storage">Upload from Device (Camera Roll)</option>
                                        </select>
                                    </div>

                                    {newModule.video_source === 'storage' ? (
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="py-12 border-2 border-dashed border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center text-center bg-zinc-950/50 group-hover:border-blue-500/50 transition-all">
                                                    {uploading ? (
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Uploading to Cockpit...</span>
                                                        </div>
                                                    ) : newModule.video_url ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Video Secured</span>
                                                            <span className="text-[9px] text-zinc-600 truncate max-w-[200px]">{newModule.video_url}</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Video className="w-10 h-10 text-zinc-700 mb-4 group-hover:text-blue-500 transition-all" />
                                                            <p className="text-xs font-bold text-zinc-500 mb-1">Select from Camera Roll</p>
                                                            <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Maximum quality supported</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">URL / Source Link</label>
                                            <input
                                                required
                                                value={newModule.video_url}
                                                onChange={(e) => setNewModule({ ...newModule, video_url: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                                            <div>
                                                <p className="text-xs font-bold text-white">Unskippable Content</p>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Block forward seeking for ATCOs</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewModule({ ...newModule, is_unskippable: !newModule.is_unskippable })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${newModule.is_unskippable ? 'bg-blue-600' : 'bg-zinc-800'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newModule.is_unskippable ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-purple-600/5 border border-purple-500/20 rounded-2xl">
                                            <div>
                                                <p className="text-xs font-bold text-purple-100 italic">Integrate Interactive Quiz</p>
                                                <p className="text-[10px] text-purple-500/60 font-bold uppercase tracking-tight">Add a small quiz after this video</p>
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

                            {newModule.module_type === 'live' && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Classroom URL (Zoom/Teams)</label>
                                    <input
                                        required
                                        value={newModule.video_url}
                                        onChange={(e) => setNewModule({ ...newModule, video_url: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                                        placeholder="https://zoom.us/j/..."
                                    />
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight ml-1 leading-relaxed">Students can track attendance by clicking the link.</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsAddingModule(false)} className="flex-1 py-4 text-sm font-bold text-zinc-500 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-2 bg-white text-zinc-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                    {loading ? 'Adding...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <QuizCreator
                isOpen={!!configuringQuiz}
                onClose={() => setConfiguringQuiz(null)}
                moduleId={configuringQuiz?.id || ''}
                moduleTitle={configuringQuiz?.title || ''}
                moduleType={configuringQuiz?.module_type || ''}
            />
        </div>
    )
}

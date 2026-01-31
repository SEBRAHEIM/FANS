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
        video_source: 'youtube',
        is_unskippable: false
    })
    const [configuringQuiz, setConfiguringQuiz] = useState<{ id: string, title: string, module_type: string } | null>(null)

    const supabase = createClient()

    async function handleAddCourse(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase
            .from('courses')
            .insert([newCourse])

        if (error) {
            alert('Error adding course: ' + error.message)
        } else {
            setIsAddingCourse(false)
            setNewCourse({ title: '', description: '', type: 'course' })
            router.refresh()
            // The parent will re-fetch and pass new courses
        }
        setLoading(false)
    }

    async function handleAddModule(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedCourse) return
        setLoading(true)

        const { error } = await supabase
            .from('course_modules')
            .insert([{
                ...newModule,
                course_id: selectedCourse.id,
                order_index: (selectedCourse.modules?.length || 0) + 1
            }])

        if (error) {
            alert('Error adding module: ' + error.message)
        } else {
            setIsAddingModule(false)
            setNewModule({
                title: '',
                module_type: 'video',
                video_url: '',
                video_source: 'youtube',
                is_unskippable: false
            })
            router.refresh()
        }
        setLoading(false)
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
                {courses.map((course) => (
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                                <div className="space-y-2 col-span-full sm:col-span-1">
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
                                <div className="space-y-2 col-span-full sm:col-span-1">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Curriculum Type</label>
                                    <select
                                        required
                                        value={newCourse.type}
                                        onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                    >
                                        <option value="course">Standard Course</option>
                                        <option value="coc">Certificate of Competency (COC)</option>
                                        <option value="exam">Official Examination</option>
                                        <option value="other">Other Material</option>
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description / Objectives</label>
                                    <textarea
                                        required
                                        value={newCourse.description}
                                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-none shadow-inner"
                                        placeholder="Outline what the ATCO will learn..."
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 text-blue-500 mb-2">
                                    <Video className="w-5 h-5" />
                                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">Initial Material (Optional)</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Video URL (Vimeo/YouTube)</label>
                                        <input
                                            className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800/50 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="py-4 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <FileText className="w-6 h-6 text-zinc-700 mb-2" />
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">or Select PDF Study Material</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 sm:pt-0">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Create Curriculum
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
                                            onChange={(e) => setNewModule({ ...newModule, video_source: e.target.value as any })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 appearance-none shadow-inner"
                                        >
                                            <option value="youtube">YouTube</option>
                                            <option value="vimeo">Vimeo</option>
                                            <option value="storage">Direct Upload / Link</option>
                                        </select>
                                    </div>
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

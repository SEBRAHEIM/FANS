'use client'

import { useState } from 'react'
import { Plus, Video, HelpCircle, FileText, ChevronRight, Play, CheckCircle2, MoreVertical, Trash2, Settings } from 'lucide-react'
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
    module_type: 'video' | 'quiz' | 'document'
    order_index: number
}

interface CourseManagerProps {
    initialCourses: Course[]
}

export default function CourseManager({ initialCourses }: CourseManagerProps) {
    const router = useRouter()
    const [courses, setCourses] = useState(initialCourses)
    const [isAddingCourse, setIsAddingCourse] = useState(false)
    const [newCourse, setNewCourse] = useState({ title: '', description: '', type: 'course' })
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [isAddingModule, setIsAddingModule] = useState(false)
    const [newModule, setNewModule] = useState({ title: '', module_type: 'video', video_url: '' })
    const [configuringQuiz, setConfiguringQuiz] = useState<{ id: string, title: string } | null>(null)

    const supabase = createClient()

    async function handleAddCourse(e: React.FormEvent) {
        e.preventDefault()
        const { data, error } = await supabase
            .from('courses')
            .insert([newCourse])
            .select()

        if (error) {
            alert('Error adding course: ' + error.message)
        } else {
            setCourses([...courses, data[0]])
            setIsAddingCourse(false)
            setNewCourse({ title: '', description: '', type: 'course' })
            router.refresh()
        }
    }

    async function handleAddModule(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedCourse) return

        const { data, error } = await supabase
            .from('course_modules')
            .insert([{
                ...newModule,
                course_id: selectedCourse.id,
                order_index: (selectedCourse.modules?.length || 0) + 1
            }])
            .select()

        if (error) {
            alert('Error adding module: ' + error.message)
        } else {
            // Update local state or refresh
            router.refresh()
            setIsAddingModule(false)
            setNewModule({ title: '', module_type: 'video', video_url: '' })
            // Re-fetch or rely on refresh
        }
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
                                                onClick={() => setConfiguringQuiz({ id: module.id, title: module.title })}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAddingCourse(false)} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">NEW COURSE</h3>
                        <form onSubmit={handleAddCourse} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Title</label>
                                <input
                                    required
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="e.g. Advanced Approach Procedures"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Description</label>
                                <textarea
                                    required
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all min-h-[120px] resize-none"
                                    placeholder="Brief outline of the course objectives..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsAddingCourse(false)} className="flex-1 py-4 text-sm font-bold text-zinc-500 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="flex-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">Create Course</button>
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
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Video URL (Vimeo/YouTube)</label>
                                    <input
                                        required
                                        value={newModule.video_url}
                                        onChange={(e) => setNewModule({ ...newModule, video_url: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                                        placeholder="https://..."
                                    />
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight ml-1 leading-relaxed">Video skip controls will be disabled for ATCOs.</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsAddingModule(false)} className="flex-1 py-4 text-sm font-bold text-zinc-500 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="flex-2 bg-white text-zinc-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">Confirm</button>
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
            />
        </div>
    )
}

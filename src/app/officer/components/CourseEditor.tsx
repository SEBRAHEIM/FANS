'use client'

import { useState, useEffect } from 'react'
import { X, Save, Eye, ChevronRight, BookOpen, LayoutDashboard, Lock, Users, Plus, Trash2, Settings, Sparkles, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CourseEditorProps {
    courseId?: string
    onClose: () => void
}

export default function CourseEditor({ courseId, onClose }: CourseEditorProps) {
    const [currentTab, setCurrentTab] = useState<'info' | 'builder' | 'visibility' | 'rules'>('info')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [course, setCourse] = useState<any>({
        title: '',
        description: '',
        status: 'draft',
        category: 'mandatory',
        version: '1.0.0',
        audience: { groups: [], users: [] },
        modules: []
    })
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (courseId) {
            fetchCourse()
        }
    }, [courseId])

    async function fetchCourse() {
        setLoading(true)
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                modules:course_modules(*)
            `)
            .eq('id', courseId)
            .single()

        if (data) setCourse(data)
        setLoading(false)
    }

    async function handleSave(newStatus?: string) {
        setSaving(true)
        const updatedCourse = {
            ...course,
            id: courseId || crypto.randomUUID(),
            status: newStatus || course.status,
            updated_at: new Date().toISOString()
        }

        const { error } = await supabase
            .from('courses')
            .upsert(updatedCourse)

        if (!error) {
            setCourse(updatedCourse)
            router.refresh()
            // Optional: onClose() if creating new
        }
        setSaving(false)
    }

    async function handlePublish() {
        await handleSave('published')
        onClose()
    }

    const tabs = [
        { id: 'info', label: '1. Course Info', icon: BookOpen },
        { id: 'builder', label: '2. Course Builder', icon: LayoutDashboard },
        { id: 'visibility', label: '3. Visibility & Access', icon: Lock },
        { id: 'rules', label: '4. Assignment Rules', icon: Users },
    ] as const

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Toolbar */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                    <div className="h-8 w-px bg-white/5" />
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                            {courseId ? 'Edit Course' : 'Create New Training'}
                        </h2>
                        <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                            {course.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-4">
                        <span className={`w-1.5 h-1.5 rounded-full ${saving ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                        {saving ? 'Saving changes...' : 'All changes saved'}
                    </div>
                    <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                        Preview
                    </button>
                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                        Publish Training
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="h-16 border-b border-white/5 flex items-center px-12 gap-8 bg-zinc-900/20">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={`group flex items-center gap-3 h-full transition-all relative ${currentTab === tab.id ? 'text-blue-500' : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                        {currentTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-12 no-scrollbar">
                <div className="max-w-4xl mx-auto">
                    {currentTab === 'info' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <section className="space-y-6">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Primary Information</h3>
                                <div className="space-y-4">
                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Training Title</span>
                                        <input
                                            type="text"
                                            value={course.title}
                                            onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-blue-500/50 outline-none transition-all"
                                            placeholder="e.g. Tower Refresher 2024"
                                        />
                                    </label>
                                    <label className="block space-y-2">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Description</span>
                                        <textarea
                                            value={course.description}
                                            onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold h-32 focus:border-blue-500/50 outline-none transition-all resize-none"
                                            placeholder="Brief overview of the course content..."
                                        />
                                    </label>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Classification</h3>
                                    <div className="space-y-4">
                                        <label className="block space-y-2">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Category</span>
                                            <select
                                                value={course.category}
                                                onChange={(e) => setCourse({ ...course, category: e.target.value })}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none cursor-pointer"
                                            >
                                                <option value="mandatory">Mandatory Training</option>
                                                <option value="recurrent">Recurrent Evaluation</option>
                                                <option value="reference">Reference Material</option>
                                            </select>
                                        </label>
                                    </div>
                                </section>
                                <section className="space-y-6">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Workflow</h3>
                                    <div className="space-y-4">
                                        <label className="block space-y-2">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Version</span>
                                            <input
                                                type="text"
                                                value={course.version}
                                                onChange={(e) => setCourse({ ...course, version: e.target.value })}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                                                placeholder="1.0.0"
                                            />
                                        </label>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {currentTab === 'builder' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex justify-between items-center bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Curriculum Builder</h3>
                                    <p className="text-zinc-500 text-xs font-medium">Add modules, evaluations, and interactive content.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                                        <Sparkles className="w-4 h-4" /> AI Assist
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                                        <Plus className="w-4 h-4" /> Add Module
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {course.modules.length > 0 ? (
                                    course.modules.map((m: any, i: number) => (
                                        <div key={m.id} className="p-6 glass rounded-2xl border border-white/5 flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-[10px] font-black text-zinc-600">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white uppercase tracking-tight">{m.title}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{m.module_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:text-blue-500"><Settings className="w-5 h-5" /></button>
                                                <button className="p-2 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                        <LayoutDashboard className="w-12 h-12 text-zinc-800 mb-4" />
                                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No modules yet. Click "Add Module" to begin.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentTab === 'visibility' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                            <section className="space-y-6">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Audience Targeting</h3>
                                <div className="p-8 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-bold uppercase tracking-tight">Assigned Groups</p>
                                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">Only ATCOs in these groups will see this course in their catalog.</p>
                                        </div>
                                        <button className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                                            Manage Groups
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                            All ATCOs <X className="w-3 h-3 cursor-pointer" />
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

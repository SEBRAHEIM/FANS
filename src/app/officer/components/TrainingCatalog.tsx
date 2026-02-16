'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Settings, Users, Trash2, BookOpen, Clock, CheckCircle2, AlertCircle, FileText, Edit, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

import { deleteCourseAction } from '@/app/officer/actions'

interface Course {
    id: string
    title: string
    description: string
    status: 'draft' | 'published' | 'archived'
    version: number
    updated_at: string
    modules?: { count: number }[]
    assessments?: { count: number }[]
    assignments?: { count: number }[]
}

interface TrainingCatalogProps {
    courses: Course[]
    onRefresh?: () => void
}

export default function TrainingCatalog({ courses: initialCourses, onRefresh }: TrainingCatalogProps) {
    const [courses, setCourses] = useState(initialCourses)
    const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        setCourses(initialCourses)
    }, [initialCourses])

    const filteredCourses = courses.filter(course => {
        if (filter === 'all') return true
        return course.status === filter
    })

    const statusColors = {
        draft: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
        published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        archived: 'bg-red-500/10 text-red-500 border-red-500/20'
    }

    const handleAction = async (courseId: string, action: string) => {
        if (action === 'delete') {
            if (!confirm('Are you sure you want to permanently delete this training asset?')) return
        }

        setProcessing(courseId)
        try {
            if (action === 'delete') {
                const res = await deleteCourseAction(courseId)
                if (res.error) throw new Error(res.error)
                if (onRefresh) onRefresh()
                else router.refresh()
                setActiveMenuId(null)
                return
            }

            let endpoint = `/api/courses/${courseId}`
            let method = 'PATCH'
            let body: any = {}

            if (action === 'publish') {
                endpoint += '/publish'
                method = 'POST'
            } else if (action === 'unpublish') {
                endpoint += '/unpublish'
                method = 'POST'
            } else if (action === 'duplicate') {
                endpoint += '/duplicate'
                method = 'POST'
            } else if (action === 'archive') {
                body = { status: 'archived' }
            }

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            // Refresh or update local state
            if (onRefresh) onRefresh()
            else router.refresh()
            setActiveMenuId(null)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredCourses.map((course) => (
                    <div key={course.id} className={`glass rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all group ${processing === course.id ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[course.status]}`}>
                                        {course.status}
                                    </span>
                                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                                        v{course.version}.0
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-white group-hover:text-blue-500 transition-colors truncate">{course.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-zinc-500">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                        <FileText className="w-3.5 h-3.5" />
                                        {(course as any).modules?.length || 0} Modules
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {(course as any).assessments?.length || 0} Assessments
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                        <Users className="w-3.5 h-3.5" />
                                        0 Assigned
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ml-2 italic text-zinc-700">
                                        Updated {format(new Date(course.updated_at), 'MMM dd')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Link
                                href={`/officer/courses/${course.id}`}
                                className="flex-1 md:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all shadow-xl"
                            >
                                Open Detail
                            </Link>
                            <button
                                onClick={() => setActiveMenuId(activeMenuId === course.id ? null : course.id)}
                                className={`p-3 rounded-2xl transition-all ${activeMenuId === course.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-950 border border-white/5 text-zinc-600 hover:text-white'}`}
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        {activeMenuId === course.id && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                <div className="absolute right-6 top-20 md:top-auto md:right-24 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => router.push(`/officer/content?edit=${course.id}`)}
                                        className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-blue-500 transition-all border-b border-white/5 flex items-center gap-3">
                                        <Edit className="w-4 h-4" /> Edit Builder
                                    </button>
                                    {course.status === 'draft' ? (
                                        <button
                                            onClick={() => handleAction(course.id, 'publish')}
                                            className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-emerald-500 hover:bg-white/5 transition-all border-b border-white/5 flex items-center gap-3">
                                            <CheckCircle2 className="w-4 h-4" /> Publish Training
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(course.id, 'unpublish')}
                                            className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 transition-all border-b border-white/5 flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4" /> Unpublish
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleAction(course.id, 'duplicate')}
                                        className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 transition-all border-b border-white/5 flex items-center gap-3">
                                        <FileText className="w-4 h-4" /> Duplicate
                                    </button>
                                    <button
                                        onClick={() => handleAction(course.id, 'archive')}
                                        className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 transition-all border-b border-white/5 flex items-center gap-3">
                                        <Trash2 className="w-4 h-4" /> Archive Asset
                                    </button>
                                    <button
                                        onClick={() => handleAction(course.id, 'delete')}
                                        className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3">
                                        <Trash className="w-4 h-4" /> Delete Training
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {filteredCourses.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center glass rounded-[3rem] border-dashed border-white/10">
                    <AlertCircle className="w-12 h-12 text-zinc-800 mb-4" />
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No course objects found.</p>
                </div>
            )}
        </div>
    )
}

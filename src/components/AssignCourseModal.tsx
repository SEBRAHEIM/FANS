'use client'

import { useState } from 'react'
import { Calendar, Users, MapPin, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Course {
    id: string
    title: string
}

interface Location {
    id: string
    name: string
}

interface Profile {
    id: string
    full_name: string
    username: string
}

interface AssignCourseModalProps {
    atcoId: string
    atcoName: string
    isOpen: boolean
    onClose: () => void
    courses: Course[]
    locations: Location[]
    ojtis: Profile[]
}

export default function AssignCourseModal({
    atcoId,
    atcoName,
    isOpen,
    onClose,
    courses,
    locations,
    ojtis
}: AssignCourseModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        course_id: '',
        location_id: '',
        ojti_id: '',
        start_date: '',
        notes: ''
    })

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()

        const { error } = await supabase
            .from('sessions')
            .insert([{
                atco_id: atcoId,
                course_id: formData.course_id,
                location_id: formData.location_id || null,
                ojti_id: formData.ojti_id || null,
                start_date: new Date(formData.start_date).toISOString(),
                status: 'scheduled',
                notes: formData.notes
            }])

        if (error) {
            console.error('Error assigning course:', error)
            alert('Failed to assign course. Please try again.')
        } else {
            router.refresh()
            onClose()
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl sm:block hidden" onClick={onClose} />
            <div className="absolute inset-0 bg-zinc-950 sm:hidden" onClick={onClose} />

            <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-zinc-950 sm:bg-zinc-900 border-x-0 sm:border border-zinc-800 sm:rounded-[2.5rem] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 no-scrollbar">
                <header className="p-6 sm:p-8 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Assign Training</h3>
                        <p className="text-zinc-500 text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1">Personnel: <span className="text-white">{atcoName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-colors">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Select Course</label>
                            <select
                                required
                                value={formData.course_id}
                                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                                className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none text-white lg:text-zinc-100"
                            >
                                <option value="" className="bg-zinc-900">Choose a course...</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Location</label>
                                <select
                                    value={formData.location_id}
                                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none text-white lg:text-zinc-100"
                                >
                                    <option value="" className="bg-zinc-900">TBD / Online</option>
                                    {locations.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Assign OJTI</label>
                                <select
                                    value={formData.ojti_id}
                                    onChange={(e) => setFormData({ ...formData, ojti_id: e.target.value })}
                                    className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none text-white lg:text-zinc-100"
                                >
                                    <option value="" className="bg-zinc-900">No Instructor</option>
                                    {ojtis.map(o => (
                                        <option key={o.id} value={o.id}>{o.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Start Date & Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all text-white lg:text-zinc-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Administrative Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any specific requirements..."
                                className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all min-h-[80px] md:min-h-[100px] resize-none text-white lg:text-zinc-100 shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:flex-1 px-8 py-5 sm:py-4 rounded-2xl border border-zinc-800 text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 text-zinc-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.course_id || !formData.start_date}
                            className="w-full sm:flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-12 py-5 sm:py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Confirm
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

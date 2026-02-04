'use client'

import { useState, useEffect } from 'react'
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
    ojtis: Profile[]
    initialData?: {
        id: string
        course_manual?: string
        location_manual?: string
        ojti_id?: string
        start_date: string
        notes?: string
    } | null
}

export default function AssignCourseModal({
    atcoId,
    atcoName,
    isOpen,
    onClose,
    ojtis,
    initialData
}: AssignCourseModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        course_manual: '',
        location_manual: '',
        ojti_id: '',
        start_date: '',
        start_time: '08:00',
        notes: ''
    })

    useEffect(() => {
        if (isOpen) {
            const dateObj = initialData?.start_date ? new Date(initialData.start_date) : new Date()
            setFormData({
                course_manual: initialData?.course_manual || '',
                location_manual: initialData?.location_manual || '',
                ojti_id: initialData?.ojti_id || '',
                start_date: dateObj.toISOString().split('T')[0],
                start_time: initialData?.start_date ? dateObj.toTimeString().slice(0, 5) : '08:00',
                notes: initialData?.notes || ''
            })
        }
    }, [isOpen, initialData])

    const isEditing = !!initialData?.id

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()

        // Combine date and time
        const combinedDateTime = new Date(`${formData.start_date}T${formData.start_time}:00`).toISOString()

        const payload = {
            atco_id: atcoId,
            course_id: null,
            course_manual: formData.course_manual,
            location_id: null,
            location_manual: formData.location_manual,
            ojti_id: formData.ojti_id || null,
            start_date: combinedDateTime,
            status: 'scheduled',
            notes: formData.notes
        }

        const { error } = isEditing
            ? await supabase.from('sessions').update(payload).eq('id', initialData.id)
            : await supabase.from('sessions').insert([payload])

        if (error) {
            console.error('Error saving course:', error)
            alert('Failed to save course. Please try again.')
        } else {
            router.refresh()
            onClose()
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to remove this training session?')) return
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.from('sessions').delete().eq('id', initialData?.id)

        if (error) {
            alert('Failed to delete: ' + error.message)
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
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">
                            {isEditing ? 'Modify Training' : 'Assign Training'}
                        </h3>
                        <p className="text-zinc-500 text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1">Personnel: <span className="text-white">{atcoName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-colors">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Training / Course Name</label>
                            <input
                                required
                                value={formData.course_manual}
                                onChange={(e) => setFormData({ ...formData, course_manual: e.target.value })}
                                placeholder="e.g. Advanced Radar Simulation"
                                className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Location / Site</label>
                                <input
                                    required
                                    value={formData.location_manual}
                                    onChange={(e) => setFormData({ ...formData, location_manual: e.target.value })}
                                    placeholder="e.g. EBBR Gate A2"
                                    className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                                />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Training Date</label>
                                <div className="w-full bg-zinc-900/50 sm:bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 text-sm font-bold text-zinc-500 flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-zinc-600" />
                                    {new Date(formData.start_date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Start Time</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        required
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full bg-zinc-900 sm:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all text-white lg:text-zinc-100 uppercase"
                                    />
                                </div>
                            </div>
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
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full sm:flex-1 px-8 py-5 sm:py-4 rounded-2xl border border-red-900/50 bg-red-900/10 text-red-500 text-sm font-bold hover:bg-red-900/20 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:flex-1 px-8 py-5 sm:py-4 rounded-2xl border border-zinc-800 text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 text-zinc-400"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !formData.course_manual || !formData.start_time}
                            className={`w-full ${isEditing ? 'sm:flex-1' : 'sm:flex-[2]'} bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-12 py-5 sm:py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    {isEditing ? 'Update Session' : 'Confirm'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

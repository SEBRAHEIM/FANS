import React from 'react'
import { CheckCircle2, Clock, Users, User, ShieldCheck, Mail, MapPin } from 'lucide-react'

interface Instructor {
    name: string
    role: string
    avatar_url?: string
}

interface CoursePreviewProps {
    course: {
        title: string
        description: string
        detailed_content?: string
        objectives?: string[]
        target_audience?: string
        instructors?: Instructor[]
        cover_page_url?: string
        estimated_duration?: number
        category?: string
        custom_settings?: {
            fontFamily?: string
            themeColor?: string
            fontSize?: string
        }
    }
}

export default function CourseDetailsPreview({ course }: CoursePreviewProps) {
    const {
        title,
        description,
        detailed_content,
        objectives = [],
        target_audience,
        instructors = [],
        cover_page_url,
        estimated_duration = 15,
        category,
        custom_settings = {}
    } = course

    const themeColor = custom_settings.themeColor || '#3b82f6'
    const fontFamily = custom_settings.fontFamily || 'Inter'

    return (
        <div className="bg-white text-zinc-900 min-h-screen font-sans" style={{ fontFamily }}>
            {/* Header Area */}
            <div className="border-b border-zinc-100 bg-white">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
                            <span>Catalogues</span>
                            <span>/</span>
                            <span className="text-zinc-600">{category || 'General'}</span>
                        </div>
                        <h1 className="text-3xl font-black text-[#003366] tracking-tight mb-2">
                            {title || 'Untitled Training'}
                        </h1>
                        <div className="flex items-center gap-4 text-zinc-500 text-sm font-medium">
                            <div className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4" />
                                <span>Classroom course</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-zinc-100 sticky top-0 bg-white z-10">
                <div className="max-w-6xl mx-auto px-6 flex gap-8">
                    <button className="py-4 border-b-2 border-blue-600 text-blue-600 font-bold text-sm tracking-tight">Description</button>
                    <button className="py-4 text-zinc-400 font-bold text-sm tracking-tight hover:text-zinc-600 transition-colors">Available dates</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Short Description */}
                        <div className="text-zinc-700 leading-relaxed text-lg">
                            {description || 'No summary description provided.'}
                        </div>

                        {/* Detailed Content */}
                        {detailed_content && (
                            <div className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed">
                                {detailed_content.split('\n').map((para, i) => (
                                    <p key={i} className="mb-4">{para}</p>
                                ))}
                            </div>
                        )}

                        {/* Objectives */}
                        {objectives.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#336699] tracking-tight">Objectives</h3>
                                <p className="text-zinc-600 font-medium italic mb-4">After completing this training, participants will:</p>
                                <ul className="space-y-4">
                                    {objectives.map((obj, i) => (
                                        <li key={i} className="flex gap-4">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0" />
                                            <span className="text-zinc-700 leading-relaxed">{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Audience */}
                        {target_audience && (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-[#336699] tracking-tight">Audience</h3>
                                <p className="text-zinc-700 leading-relaxed">
                                    {target_audience}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-8">
                        {/* Course Card / Image */}
                        <div className="rounded-2xl overflow-hidden aspect-video bg-zinc-100 border border-zinc-100 shadow-sm relative group cursor-pointer">
                            {cover_page_url ? (
                                <img src={cover_page_url} alt={title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <span className="text-[10px] uppercase font-black tracking-widest">No Cover Image</span>
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <button className="w-full bg-[#fbc02d] hover:bg-[#f9a825] text-[#003366] font-black py-4 px-8 rounded-xl text-sm uppercase tracking-tighter transition-all shadow-lg shadow-yellow-500/10">
                            Course Registration Request
                        </button>

                        {/* Meta Boxes */}
                        <div className="bg-[#42a5f5] text-white p-6 rounded-2xl shadow-sm space-y-2">
                            <h4 className="text-lg font-black tracking-tight">Duration</h4>
                            <p className="text-sm font-medium opacity-90 leading-relaxed">
                                This training takes {estimated_duration} minutes of intensive focus.
                            </p>
                        </div>

                        {/* Delivered By */}
                        <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-2xl space-y-6">
                            <h4 className="text-[#336699] font-black text-lg tracking-tight">Delivered by</h4>
                            <div className="space-y-6">
                                {instructors.length > 0 ? instructors.map((inst, i) => (
                                    <div key={i} className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-zinc-200">
                                            {inst.avatar_url ? (
                                                <img src={inst.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                    <User className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-zinc-900 leading-none mb-1">{inst.name}</p>
                                            <p className="text-xs font-bold text-zinc-500">{inst.role}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs font-bold text-zinc-400 uppercase italic">No instructors listed</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FileText(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    )
}

function ImageIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
}

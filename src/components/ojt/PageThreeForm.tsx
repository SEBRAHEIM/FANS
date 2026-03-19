'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import SignaturePad from './SignaturePad'

const STORAGE_KEY = 'fans_ojt_draft_p3'

interface PageThreeData {
    teamwork: string
    additionalComments: string
    recommendationAction: string
    recommendationCompetency: string
    disagreementComments: string
    atcoSignature: { name: string, signature: string, date: string }
    ojtiSignature: { name: string, signature: string, date: string }
}

const defaultState: PageThreeData = {
    teamwork: '',
    additionalComments: '',
    recommendationAction: '',
    recommendationCompetency: '',
    disagreementComments: '',
    atcoSignature: { name: '', signature: '', date: '' },
    ojtiSignature: { name: '', signature: '', date: '' }
}

const actionOptions = [
    'Continue Training',
    'Suspension of Training',
    'Proceed for Evaluation Check/COC'
]

const competencyOptions = [
    'Competent',
    'Not Yet Competent',
    'Not Competent'
]

export default function PageThreeForm() {
    const [formData, setFormData] = useState<PageThreeData>(defaultState)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                setFormData(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse saved OJT P3 draft', e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Auto-save logic
    useEffect(() => {
        if (!isLoaded) return

        setIsSaving(true)
        const timeoutId = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
            setLastSaved(new Date())
            setIsSaving(false)
        }, 1000)

        return () => clearTimeout(timeoutId)
    }, [formData, isLoaded])

    if (!isLoaded) return <div className="p-10 text-center text-zinc-500">Loading form...</div>

    const updateField = (field: keyof PageThreeData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateSignature = (role: 'atcoSignature' | 'ojtiSignature', field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [role]: { ...prev[role], [field]: value }
        }))
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Auto Save Header */}
            <div className="bg-blue-600/10 border-b border-blue-500/20 px-8 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Save className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                        Draft Auto-Saved locally
                    </span>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    {isSaving ? 'Saving...' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : ''}
                </div>
            </div>

            <div className="p-8 md:p-12 space-y-12 overflow-y-auto w-full max-w-4xl mx-auto">
                <header className="mb-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Final Review</h3>
                    <p className="text-zinc-500 text-sm">
                        Complete the final assessments, recommendations, and formal signatures for this training report.
                    </p>
                </header>

                {/* Text Comments Section */}
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-white uppercase tracking-widest ml-1">Teamwork</label>
                        <textarea
                            value={formData.teamwork}
                            onChange={e => updateField('teamwork', e.target.value)}
                            rows={3}
                            placeholder="Provide details on teamwork performance..."
                            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-y shadow-inner"
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-xs font-black text-white uppercase tracking-widest ml-1">Additional Comments</label>
                        <textarea
                            value={formData.additionalComments}
                            onChange={e => updateField('additionalComments', e.target.value)}
                            rows={4}
                            placeholder="Enter any additional free text comments..."
                            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-y shadow-inner"
                        />
                    </div>
                </div>

                {/* OJTI / Assessor Recommendation Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest border-b border-white/5 pb-4">OJTI / Assessor Recommendation</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Action Selections */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Training Action</h5>
                            <div className="space-y-3 flex flex-col">
                                {actionOptions.map(option => (
                                    <label key={option} className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                        formData.recommendationAction === option 
                                            ? "border-blue-500 bg-blue-500/10 text-blue-400 font-bold" 
                                            : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10 hover:text-white"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                            formData.recommendationAction === option ? "border-blue-500" : "border-zinc-700"
                                        )}>
                                            {formData.recommendationAction === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                        </div>
                                        <span className="text-sm tracking-wide">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Competency Selections */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Competency Assessment</h5>
                            <div className="space-y-3 flex flex-col">
                                {competencyOptions.map(option => (
                                    <label key={option} className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                        formData.recommendationCompetency === option 
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" 
                                            : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10 hover:text-white"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                            formData.recommendationCompetency === option ? "border-emerald-500" : "border-zinc-700"
                                        )}>
                                            {formData.recommendationCompetency === option && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                        </div>
                                        <span className="text-sm tracking-wide">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ATCO Agreement Section */}
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-8 space-y-6">
                    <p className="text-sm text-blue-100/80 font-medium leading-relaxed italic border-l-4 border-blue-500 pl-4">
                        "ATCO: I have received a thorough briefing on this report and I am in alignment with its contents. My signature confirms my agreement. In the event of any disagreement, please provide comments indicating the specific points of disagreement before appending your signature."
                    </p>

                    <div className="space-y-3 pt-4">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Disagreement Comments (If any)</label>
                        <textarea
                            value={formData.disagreementComments}
                            onChange={e => updateField('disagreementComments', e.target.value)}
                            rows={3}
                            placeholder="Enter specific points of disagreement if applicable..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-5 text-zinc-300 focus:outline-none focus:border-blue-500/40 transition-colors resize-y"
                        />
                    </div>
                </div>

                {/* Signatures Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Signatures</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ATCO Signature */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-6">
                            <h5 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" /> ATCO
                            </h5>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.atcoSignature.name}
                                        onChange={e => updateSignature('atcoSignature', 'name', e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.atcoSignature.date}
                                        onChange={e => updateSignature('atcoSignature', 'date', e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Signature</label>
                                    <SignaturePad 
                                        value={formData.atcoSignature.signature}
                                        onChange={(val) => updateSignature('atcoSignature', 'signature', val)}
                                        color="#a855f7"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* OJTI Signature */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-6">
                            <h5 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" /> OJTI / Assessor
                            </h5>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.ojtiSignature.name}
                                        onChange={e => updateSignature('ojtiSignature', 'name', e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.ojtiSignature.date}
                                        onChange={e => updateSignature('ojtiSignature', 'date', e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Signature</label>
                                    <SignaturePad 
                                        value={formData.ojtiSignature.signature}
                                        onChange={(val) => updateSignature('ojtiSignature', 'signature', val)}
                                        color="#3b82f6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Spacer block at end to ensure scrollibility to bottom elements */}
                <div className="h-10" />
            </div>
        </div>
    )
}

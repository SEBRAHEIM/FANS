'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Wind, CloudRain, Save, CheckCircle } from 'lucide-react'

// Define the shape of our form data for the auto-save functionality
interface OjtFormData {
    atcoName: string
    date: string
    reportNumber: string
    position: 'ADC' | 'APP' | 'APS' | ''
    workload: 'Light' | 'Medium' | 'Heavy' | ''
    flightRules: {
        vfr: boolean
        ifr: boolean
    }
    weather: {
        vmc: boolean
        imc: boolean
    }
    time: {
        from: string
        to: string
        total: string
        accumulated: string
    }
    purpose: string
    comments: string
}

const STORAGE_KEY = 'fans_ojt_draft_p1'

const defaultState: OjtFormData = {
    atcoName: '',
    date: new Date().toISOString().split('T')[0],
    reportNumber: '',
    position: '',
    workload: '',
    flightRules: { vfr: false, ifr: false },
    weather: { vmc: false, imc: false },
    time: { from: '', to: '', total: '', accumulated: '' },
    purpose: '',
    comments: ''
}

export default function PageOneForm() {
    const [formData, setFormData] = useState<OjtFormData>(defaultState)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                setFormData(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse saved OJT draft', e)
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

    const updateField = (field: keyof OjtFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateNested = (category: 'flightRules' | 'weather' | 'time', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
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
                {/* 1. Basic Info */}
                <section className="space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs">1</span>
                        Assessment Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">ATCO Name</label>
                            <input 
                                type="text"
                                value={formData.atcoName}
                                onChange={e => updateField('atcoName', e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Date
                            </label>
                            <input 
                                type="date"
                                value={formData.date}
                                onChange={e => updateField('date', e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Report Number</label>
                            <input 
                                type="text"
                                value={formData.reportNumber}
                                onChange={e => updateField('reportNumber', e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                placeholder="OJT-202X-XXX"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Operational Environment */}
                <section className="space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs">2</span>
                        Operational Environment
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Position & Workload */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Position
                                </label>
                                <div className="flex gap-3">
                                    {['ADC', 'APP', 'APS'].map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => updateField('position', pos)}
                                            className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                                                formData.position === pos 
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                        >
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Workload</label>
                                <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
                                    {['Light', 'Medium', 'Heavy'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => updateField('workload', level)}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase transition-all ${
                                                formData.workload === level 
                                                ? 'bg-white text-black shadow-md' 
                                                : 'text-zinc-500 hover:text-white'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Rules & Weather */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Wind className="w-3 h-3" /> Flight Rules
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                            formData.flightRules.vfr ? 'bg-blue-600 border-blue-500' : 'bg-zinc-900 border-white/20 group-hover:border-white/40'
                                        }`}>
                                            {formData.flightRules.vfr && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className={`font-bold text-sm tracking-widest ${formData.flightRules.vfr ? 'text-white' : 'text-zinc-500'}`}>VFR</span>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={formData.flightRules.vfr}
                                            onChange={e => updateNested('flightRules', 'vfr', e.target.checked)}
                                        />
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group ml-6">
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                            formData.flightRules.ifr ? 'bg-blue-600 border-blue-500' : 'bg-zinc-900 border-white/20 group-hover:border-white/40'
                                        }`}>
                                            {formData.flightRules.ifr && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className={`font-bold text-sm tracking-widest ${formData.flightRules.ifr ? 'text-white' : 'text-zinc-500'}`}>IFR</span>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={formData.flightRules.ifr}
                                            onChange={e => updateNested('flightRules', 'ifr', e.target.checked)}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <CloudRain className="w-3 h-3" /> Weather Conditions
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                            formData.weather.vmc ? 'bg-blue-600 border-blue-500' : 'bg-zinc-900 border-white/20 group-hover:border-white/40'
                                        }`}>
                                            {formData.weather.vmc && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className={`font-bold text-sm tracking-widest ${formData.weather.vmc ? 'text-white' : 'text-zinc-500'}`}>VMC</span>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={formData.weather.vmc}
                                            onChange={e => updateNested('weather', 'vmc', e.target.checked)}
                                        />
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group ml-4">
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                            formData.weather.imc ? 'bg-blue-600 border-blue-500' : 'bg-zinc-900 border-white/20 group-hover:border-white/40'
                                        }`}>
                                            {formData.weather.imc && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className={`font-bold text-sm tracking-widest ${formData.weather.imc ? 'text-white' : 'text-zinc-500'}`}>IMC</span>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={formData.weather.imc}
                                            onChange={e => updateNested('weather', 'imc', e.target.checked)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Time Logging */}
                <section className="space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs">3</span>
                        Time Logging
                    </h3>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> From (UTC)
                            </label>
                            <input 
                                type="text"
                                placeholder="00:00"
                                maxLength={5}
                                value={formData.time.from}
                                onChange={e => updateNested('time', 'from', e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> To (UTC)
                            </label>
                            <input 
                                type="text"
                                placeholder="00:00"
                                maxLength={5}
                                value={formData.time.to}
                                onChange={e => updateNested('time', 'to', e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Total Hrs</label>
                            <input 
                                type="text"
                                placeholder="00:00"
                                value={formData.time.total}
                                onChange={e => updateNested('time', 'total', e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 text-blue-400">Accumulated Hrs</label>
                            <input 
                                type="text"
                                placeholder="000:00"
                                value={formData.time.accumulated}
                                onChange={e => updateNested('time', 'accumulated', e.target.value)}
                                className="w-full bg-blue-950/20 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                            />
                        </div>
                    </div>
                </section>

                {/* 4. Assessment Comments */}
                <section className="space-y-6 pt-4">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs">4</span>
                        Instructor Comments
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Purpose / Other</label>
                            <select 
                                value={formData.purpose}
                                onChange={e => updateField('purpose', e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors uppercase text-sm tracking-wider"
                            >
                                <option value="">Select Purpose...</option>
                                <option value="Currency Check">Currency Check</option>
                                <option value="Evaluation Check">Evaluation Check</option>
                                <option value="Routine Training">Routine Training</option>
                                <option value="Remedial Training">Remedial Training</option>
                                <option value="Other">Other (Specify in notes)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Scenario Log / Free Text</label>
                            <textarea 
                                value={formData.comments}
                                onChange={e => updateField('comments', e.target.value)}
                                placeholder="Write down the situations or events that occurred during this assessment..."
                                className="w-full h-40 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-zinc-600"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

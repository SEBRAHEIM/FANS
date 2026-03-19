'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle, HelpCircle, UserCheck, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'fans_ojt_draft_p2'

type AssistanceLevel = 'With Assistance' | 'Without Assistance' | ''

const criteriaKeys = [
    'situationAwareness',
    'trafficAndCapacityManagement',
    'separationAndConflictResolution',
    'communication',
    'coordination',
    'managementOfNonRoutineSituations',
    'problemSolvingAndDecisionMaking',
    'selfManagement',
    'workloadManagement'
] as const

type CriteriaKey = typeof criteriaKeys[number]

const criteriaDetails: Record<CriteriaKey, string[]> = {
    situationAwareness: [
        'Monitors air traffic in own area of responsibility and nearby airspace',
        'Monitors the meteorological conditions that impact on own area of responsibility and nearby airspace',
        'Monitors the status of the ATC systems and equipment',
        'Monitors the operational circumstances in nearby sectors to anticipate impact on own situation',
        'Scans all available sources of information',
        'Acquires information from available surveillance and flight data systems, meteorological data, electronic data displays and any other means available',
        'Integrates information acquired from monitoring and scanning into the overall picture',
        'Analyses the actual situation based on information acquired from monitoring and scanning',
        'Interprets the situation based on the analysis',
        'Anticipates the future operational situation',
        'Identifies potentially threats (e.g. high traffic volumes, mountainous terrain, complex airspace infrastructure, complex ATC procedures, adverse weather, unserviceable navigational equipment, flight crew unfamiliar with airport or procedures)',
        'Verifies that information is accurate and interpretations are correct',
        'Uses available tools to monitor, scan, comprehend and anticipate operational situations'
    ],
    trafficAndCapacityManagement: [],
    separationAndConflictResolution: [],
    communication: [],
    coordination: [],
    managementOfNonRoutineSituations: [],
    problemSolvingAndDecisionMaking: [],
    selfManagement: [],
    workloadManagement: []
}

interface PageTwoData {
    evaluations: Record<CriteriaKey, AssistanceLevel>
}

const formatCriterionName = (key: string) => {
    // split camelCase and capitalize first letter
    const spaced = key.replace(/([A-Z])/g, ' $1').trim()
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const defaultState: PageTwoData = {
    evaluations: criteriaKeys.reduce((acc, key) => {
        acc[key] = ''
        return acc
    }, {} as Record<CriteriaKey, AssistanceLevel>)
}

export default function PageTwoForm() {
    const [formData, setFormData] = useState<PageTwoData>(defaultState)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [expanded, setExpanded] = useState<CriteriaKey | null>(null)

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                setFormData(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse saved OJT P2 draft', e)
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

    const updateEvaluation = (criterion: CriteriaKey, level: AssistanceLevel) => {
        setFormData(prev => ({
            ...prev,
            evaluations: {
                ...prev.evaluations,
                [criterion]: level
            }
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

            <div className="p-8 md:p-12 space-y-10 overflow-y-auto w-full max-w-4xl mx-auto">
                <header className="mb-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Assessment of Performance</h3>
                    <p className="text-zinc-500 text-sm">
                        Evaluate the ATCO's performance across the following competency areas. Indicate whether each task was completed with or without assistance.
                    </p>
                </header>

                <div className="space-y-4">
                    {criteriaKeys.map((criterion, index) => {
                        const currentLevel = formData.evaluations[criterion]
                        const hasDetails = criteriaDetails[criterion].length > 0
                        
                        return (
                            <div key={criterion} className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden transition-all">
                                <div 
                                    onClick={() => hasDetails && setExpanded(prev => prev === criterion ? null : criterion)}
                                    className={cn(
                                        "p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors group",
                                        hasDetails ? "cursor-pointer hover:bg-white/[0.02]" : ""
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold shrink-0 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-400">
                                            {index + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-bold uppercase tracking-widest text-sm">
                                                {formatCriterionName(criterion)}
                                            </p>
                                            {hasDetails && (
                                                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", expanded === criterion && "rotate-180")} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 md:w-auto w-full" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => updateEvaluation(criterion, 'With Assistance')}
                                            className={cn(
                                                "flex-1 md:flex-none flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                                                currentLevel === 'With Assistance'
                                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/10'
                                                    : 'bg-zinc-950 border-white/5 text-zinc-500 hover:bg-zinc-900 hover:text-white'
                                            )}
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            With Assistance
                                        </button>
                                        <button
                                            onClick={() => updateEvaluation(criterion, 'Without Assistance')}
                                            className={cn(
                                                "flex-1 md:flex-none flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                                                currentLevel === 'Without Assistance'
                                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
                                                    : 'bg-zinc-950 border-white/5 text-zinc-500 hover:bg-zinc-900 hover:text-white'
                                            )}
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            Without Assistance
                                        </button>
                                    </div>
                                </div>

                                {expanded === criterion && hasDetails && (
                                    <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20">
                                        <ul className="space-y-3 mt-4">
                                            {criteriaDetails[criterion].map((detail, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-zinc-400">
                                                    <span className="text-blue-500 mt-1 shrink-0">•</span>
                                                    <span className="leading-relaxed">{detail}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

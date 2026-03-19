'use client'

import { useState } from 'react'
import { FileText, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import PageOneForm from './PageOneForm'
import PageTwoForm from './PageTwoForm'
import PageThreeForm from './PageThreeForm'

const steps = [
    { id: 1, title: 'T&A Form', description: 'Detailed Assessment' },
    { id: 2, title: 'Performance Eval', description: 'Assessment criteria' },
    { id: 3, title: 'Final Review', description: 'Pending implementation' },
]

export default function OjtFormWizard() {
    const [currentStep, setCurrentStep] = useState(1)

    return (
        <div className="space-y-8">
            {/* Progress Bar */}
            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl glass-accent">
                <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-0">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 hidden md:block rounded-full z-0 overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>
                    
                    {steps.map((step, idx) => {
                        const isCompleted = currentStep > step.id
                        const isCurrent = currentStep === step.id
                        return (
                            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3 group flex-1 md:flex-none">
                                <button
                                    onClick={() => setCurrentStep(step.id)}
                                    // Disabled changing to future steps if we wanted strict progression, but keeping free here
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-xl",
                                        isCompleted ? "bg-blue-600 text-white shadow-blue-900/20" : 
                                        isCurrent ? "bg-white text-black scale-110 shadow-white/10" : 
                                        "bg-zinc-950 text-zinc-500 border border-white/5 hover:bg-zinc-900"
                                    )}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                                </button>
                                <div className="flex flex-col md:items-center text-left md:text-center mt-1">
                                    <span className={cn(
                                        "font-black tracking-widest text-[11px] uppercase transition-colors",
                                        isCurrent || isCompleted ? "text-white" : "text-zinc-500"
                                    )}>
                                        {step.title}
                                    </span>
                                    <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider hidden md:block mt-1">
                                        {step.description}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Form Content Area */}
            <div className="relative min-h-[600px] bg-black border border-white/10 rounded-3xl overflow-hidden glass shadow-2xl transition-all duration-300">
                {currentStep === 1 && <PageOneForm />}
                {currentStep === 2 && <PageTwoForm />}
                {currentStep === 3 && <PageThreeForm />}
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between items-center mt-8 p-6 bg-zinc-900/40 border border-white/5 rounded-3xl">
                <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                    disabled={currentStep === steps.length}
                    className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    Next Page
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TrainingVideoPlayer from '@/components/training/TrainingVideoPlayer'
import { CheckCircle2, AlertCircle, ArrowRight, BrainCircuit } from 'lucide-react'

export default function CoursePage({ params }: { params: { id: string } }) {
    const [isStep1Complete, setIsStep1Complete] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    // Mock data for demonstration - in production, this would be fetched from Supabase
    const courseData = {
        title: "Advanced Radar Procedures",
        parts: [
            { id: 1, title: "Theory & Safety Protocols", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
            { id: 2, title: "Radar Simulation Workshop", videoUrl: "https://www.w3schools.com/html/movie.mp4" }
        ]
    }

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-8">
                <header className="mb-12">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                        <span>Courses</span>
                        <span>/</span>
                        <span className="text-zinc-300">{courseData.title}</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase">{courseData.parts[currentStep - 1].title}</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Part {currentStep} of {courseData.parts.length}</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                    <div className="xl:col-span-2 space-y-8">
                        <TrainingVideoPlayer
                            videoUrl={courseData.parts[currentStep - 1].videoUrl}
                            onComplete={() => setIsStep1Complete(true)}
                        />

                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">Module Overview</h3>
                            <p className="text-zinc-400 leading-relaxed font-medium">
                                In this session, we cover the latest radar protocols. Ensure you watch the entire video to unlock the mandatory assessment quiz. Seek and skip functions are disabled to maintain training integrity.
                            </p>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sticky top-8">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-blue-500" />
                                Knowledge Check
                            </h4>

                            <div className={`p-6 rounded-2xl border transition-all ${isStep1Complete ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20' : 'bg-zinc-800/50 border-zinc-700 opacity-50'}`}>
                                <h5 className="font-bold mb-2">Module Assessment</h5>
                                <p className="text-sm opacity-80 mb-6">Complete the video to start the 10-question quiz.</p>

                                <button
                                    disabled={!isStep1Complete}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${isStep1Complete ? 'bg-white text-blue-600 hover:scale-105' : 'bg-zinc-700 text-zinc-500'}`}
                                >
                                    Start Quiz
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-8 space-y-4">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Progress</p>
                                {courseData.parts.map((part, idx) => (
                                    <div key={part.id} className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${idx < currentStep - 1 || (idx === currentStep - 1 && isStep1Complete) ? 'bg-blue-500' : 'bg-zinc-800'}`} />
                                        <span className={`text-sm font-bold ${idx === currentStep - 1 ? 'text-white' : 'text-zinc-600'}`}>{part.title}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    )
}

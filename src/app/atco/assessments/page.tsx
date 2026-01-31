import Sidebar from '@/components/Sidebar'
import { CheckSquare } from 'lucide-react'

export default function AssessmentsPage() {
    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-10">
                    <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">MY ASSESSMENTS</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Review your performance evaluations and COC results.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center py-20">
                        <CheckSquare className="w-12 h-12 text-zinc-800 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Evaluations</h3>
                        <p className="text-zinc-500 text-sm max-w-[200px]">No recent assessments found in your profile.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}

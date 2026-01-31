import Sidebar from '@/components/Sidebar'
import { Calendar, Plus } from 'lucide-react'

export default function PlanningPage() {
    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">TRAINING SCHEDULE</h2>
                        <p className="text-zinc-500 font-medium tracking-tight">Plan and coordinate upcoming training sessions and simulator slots.</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95">
                        <Plus className="w-5 h-5" />
                        Create Session
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <Calendar className="w-16 h-16 text-zinc-800 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Command Calendar</h3>
                        <p className="text-zinc-500 max-w-md">The scheduler is being optimized for high-capacity planning. Manual entry is currently restricted to site admins.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}

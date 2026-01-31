import Sidebar from '@/components/Sidebar'
import { BookOpen, Search } from 'lucide-react'

export default function TrainingsPage() {
    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">MY TRAININGS</h2>
                        <p className="text-zinc-500 font-medium tracking-tight">Access your course materials, manuals, and enrollment history.</p>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-16 h-16 text-zinc-800 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Training Library</h3>
                        <p className="text-zinc-500 max-w-md">Your personalized training content is being prepared. Enrollment records will automatically sync with your profile upon completion.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}

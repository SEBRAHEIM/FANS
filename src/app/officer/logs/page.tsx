import Sidebar from '@/components/Sidebar'
import { ClipboardList } from 'lucide-react'

export default function LogsPage() {
    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="training_officer" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-10">
                    <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">COMMAND LOGS</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Audit and review all training administrative activity.</p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <ClipboardList className="w-16 h-16 text-zinc-800 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Activity Audit</h3>
                        <p className="text-zinc-500 max-w-md">The audit logging system is being reformatted for better searchability. System logs are currently available in the master database console.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}

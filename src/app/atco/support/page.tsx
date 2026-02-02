import { AlertCircle, Mail, Phone } from 'lucide-react'

export default function SupportPage() {
    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <header className="mb-10 text-center xl:text-left">
                <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">TRAINING SUPPORT</h2>
                <p className="text-zinc-500 font-medium tracking-tight">Need help with your sessions or evaluations? We're here for you.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] group hover:border-blue-500 transition-all">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Email Command</h3>
                    <p className="text-zinc-500 text-sm mb-6">Send a direct message to the training coordination office.</p>
                    <a href="mailto:support@fans-portal.com" className="text-blue-500 font-bold text-sm uppercase tracking-widest hover:underline">
                        support@fans-portal.com
                    </a>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] group hover:border-emerald-500 transition-all">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
                        <Phone className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Direct Hotline</h3>
                    <p className="text-zinc-500 text-sm mb-6">Urgent session changes or simulator issues.</p>
                    <p className="text-emerald-500 font-bold text-sm uppercase tracking-widest">
                        +971 4 000 0000
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] group hover:border-orange-500 transition-all flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Technical Issue</h3>
                        <p className="text-zinc-500 text-sm mb-6">Report a bug or access issue with the portal.</p>
                    </div>
                    <button className="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-[11px] hover:bg-zinc-750 transition-all">
                        Open Ticket
                    </button>
                </div>
            </div>
        </div>
    )
}

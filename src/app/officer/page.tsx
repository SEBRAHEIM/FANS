import { createClient } from '@/lib/supabase/server'

export default async function OfficerDashboard() {
    // keeping supabase client initialization in case it's needed for middleware auth check or future use
    const supabase = await createClient()

    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                        Command Center
                    </h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">
                        Operational Oversight & Personnel Deployment
                    </p>
                </div>
            </header>
            
            <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Welcome</h3>
                <p className="text-zinc-500 text-sm text-center max-w-md">
                    Please use the sidebar menu to navigate through your operational duties.
                </p>
            </div>
        </div>
    )
}

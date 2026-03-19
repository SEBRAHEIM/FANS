import OjtFormWizard from '@/components/ojt/OjtFormWizard'

export default function NewOjtPage() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-6xl mx-auto">
            <header className="mb-10 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white leading-none">NEW OJT ASSESSMENT</h2>
                <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">Create Training Record</p>
            </header>
            
            <OjtFormWizard />
        </div>
    )
}

import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import AtcoHeader, { AtcoHeaderSkeleton } from './components/AtcoHeader'
import UpcomingSessions, { UpcomingSessionsSkeleton } from './components/UpcomingSessions'
import TrainingPulse, { TrainingPulseSkeleton } from './components/TrainingPulse'
import OjtiCommand, { OjtiCommandSkeleton } from './components/OjtiCommand'

export default async function AtcoDashboard() {
    return (
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10">
            <Suspense fallback={<AtcoHeaderSkeleton />}>
                <AtcoHeader />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content - Upcoming Sessions */}
                <section className="lg:col-span-2">
                    <Suspense fallback={<UpcomingSessionsSkeleton />}>
                        <UpcomingSessions />
                    </Suspense>
                </section>

                {/* Sidebar Content */}
                <section className="space-y-6">
                    <Suspense fallback={<TrainingPulseSkeleton />}>
                        <TrainingPulse />
                    </Suspense>

                    <Suspense fallback={<OjtiCommandSkeleton />}>
                        <OjtiCommand />
                    </Suspense>

                    {/* Training Docs */}
                    <Link href="/atco/trainings" className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/20 transition-all">
                        <BookOpen className="absolute -right-3 -bottom-3 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">TRAINING DOCS</h3>
                        <p className="text-blue-100 text-sm mb-4 opacity-90 leading-relaxed">Access official course materials.</p>
                        <div className="inline-block bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                            Open Library
                        </div>
                    </Link>
                </section>
            </div>
        </div>
    )
}

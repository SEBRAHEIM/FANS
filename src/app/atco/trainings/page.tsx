import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { BookOpen, Search, Clock, ChevronRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TrainingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch active courses
    const { data: courses } = await supabase
        .from('courses')
        .select(`
            *,
            modules:course_modules(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    // Fetch user progress to show completion percentage
    const { data: progress } = await supabase
        .from('student_progress')
        .select('module_id')
        .eq('user_id', user?.id)
        .eq('is_completed', true)

    const completedModuleIds = new Set(progress?.map(p => p.module_id) || [])

    // Pre-calculate modules for each course to avoid 'await' inside map
    const { data: allCourseModules } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .in('course_id', courses?.map(c => c.id) || [])

    const courseModulesMap = new Map<string, string[]>()
    allCourseModules?.forEach(m => {
        const ids = courseModulesMap.get(m.course_id) || []
        ids.push(m.id)
        courseModulesMap.set(m.course_id, ids)
    })

    return (
        <div className="flex flex-col xl:flex-row bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="atco" />
            <main className="flex-1 p-6 xl:p-12 pt-24 xl:pt-10">
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h2 className="text-2xl xl:text-4xl font-black tracking-tighter uppercase text-white">MY TRAINING ZONE</h2>
                        <p className="text-zinc-500 font-medium tracking-tight">Access your official course materials and track your modular progress.</p>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses?.map((course) => {
                        const moduleCount = (course.modules?.[0] as any)?.count || 0

                        // Get modules for this specific course from the pre-fetched map
                        const courseModuleIds = new Set(courseModulesMap.get(course.id) || [])
                        const completedInThisCourse = progress?.filter(p => courseModuleIds.has(p.module_id)).length || 0
                        const completionRate = moduleCount > 0 ? Math.round((completedInThisCourse / moduleCount) * 100) : 0

                        return (
                            <Link
                                href={`/atco/trainings/${course.id}`}
                                key={course.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group active:scale-[0.98] flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center text-blue-500 border border-zinc-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-400 transition-colors">
                                        {moduleCount} MODULES
                                    </span>
                                </div>

                                <div className="flex-1 space-y-2 mb-8">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-500 transition-colors">{course.title}</h3>
                                    <p className="text-zinc-500 text-sm font-medium line-clamp-2 leading-relaxed">{course.description}</p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-zinc-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Progress</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{completionRate}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <PlayCircle className="w-4 h-4" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">Resume</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}

                    {(!courses || courses.length === 0) && (
                        <div className="col-span-full bg-zinc-900 border border-zinc-800 p-16 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                            <BookOpen className="w-20 h-20 text-zinc-800 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">No Courses Available</h3>
                            <p className="text-zinc-500 max-w-md">There are no training courses assigned to your profile at this time.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
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
        <div className="p-5 md:p-8 lg:p-12 pt-24 lg:pt-10 max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white leading-none">
                        ACADEMY CATALOG
                    </h2>
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">Official Training Path & Certifications</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="SEARCH COURSES..."
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses?.map((course) => {
                    // Get modules for this specific course from the pre-fetched map
                    const courseModuleIds = new Set(courseModulesMap.get(course.id) || [])
                    const moduleCount = courseModuleIds.size
                    const completedInThisCourse = progress?.filter(p => courseModuleIds.has(p.module_id)).length || 0
                    const completionRate = moduleCount > 0 ? Math.round((completedInThisCourse / moduleCount) * 100) : 0

                    return (
                        <Link
                            href={`/atco/trainings/${course.id}`}
                            key={course.id}
                            className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 hover:border-blue-500/30 transition-all group active:scale-[0.98] flex flex-col h-full relative overflow-hidden"
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[64px] rounded-full -mr-16 -mt-16" />

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center text-blue-500 border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        {moduleCount} MODULES
                                    </span>
                                    <div className="inline-flex px-3 py-1 bg-zinc-950 rounded-full border border-white/5">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">V{course.version || '1.0'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 mb-12 relative z-10">
                                <h3 className="text-2xl font-black text-white group-hover:text-blue-500 transition-colors uppercase tracking-tight leading-none">{course.title}</h3>
                                <p className="text-zinc-500 text-sm font-medium line-clamp-2 leading-relaxed tracking-tight">{course.description}</p>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-white/5 relative z-10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">COMPLETION STATUS</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{completionRate}%</span>
                                </div>
                                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                                </div>
                                <div className="flex items-center justify-between pt-4">
                                    <div className="flex items-center gap-3 text-zinc-400 group-hover:text-white transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-zinc-950 border border-white/5 flex items-center justify-center">
                                            <PlayCircle className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {completionRate === 100 ? 'REVIEW' : completionRate > 0 ? 'RESUME' : 'START COURSE'}
                                        </span>
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
        </div>
    )
}

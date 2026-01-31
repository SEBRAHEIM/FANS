import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { createCourse } from '@/app/admin/actions'
import { BookOpen, Plus, Search } from 'lucide-react'

export default async function ManageCourses() {
    const supabase = await createClient()

    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="flex bg-zinc-950 min-h-screen text-zinc-100">
            <Sidebar role="admin" />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Manage Courses</h2>
                        <p className="text-zinc-400">Create and organize training curriculum.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Course Form */}
                    <div className="lg:col-span-1">
                        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-8">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-500" />
                                Add New Course
                            </h3>
                            <form action={async (formData) => {
                                'use server'
                                await createCourse(formData)
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Course Title</label>
                                    <input
                                        name="title"
                                        required
                                        placeholder="e.g. Radar Approach Level 1"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Description</label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Short overview of the course..."
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl transition-all">
                                    Create Course
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* Course List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <input
                                placeholder="Search courses..."
                                className="bg-transparent border-none outline-none text-sm w-full py-1"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {courses?.map((course) => (
                                <div key={course.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-colors group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{course.title}</h4>
                                            <p className="text-zinc-400 text-sm mt-1">{course.description}</p>
                                        </div>
                                        <div className="bg-blue-500/10 p-2 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-4 text-xs text-zinc-500">
                                        <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {courses?.length === 0 && (
                                <div className="text-center py-12 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                                    No courses found. Create your first one to get started.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

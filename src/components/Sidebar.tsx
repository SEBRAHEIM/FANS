'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import {
    LayoutDashboard,
    BookOpen,
    MapPin,
    Calendar,
    Users,
    LogOut,
    CheckSquare,
    ClipboardList,
    Menu,
    X,
    FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    role: 'atco' | 'training_officer' | 'head_of_training' | 'admin' | 'instructor'
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Close sidebar on navigation and on mount to ensure it's closed on mobile
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const navItems = {
        atco: [
            { label: 'Dashboard', href: '/atco', icon: LayoutDashboard },
            { label: 'My Trainings', href: '/atco/trainings', icon: BookOpen },
            { label: 'Test Results', href: '/atco/results', icon: FileText },
            { label: 'Assessments', href: '/atco/assessments', icon: CheckSquare },
        ],
        training_officer: [
            { label: 'Dashboard', href: '/officer', icon: LayoutDashboard },
            { label: 'Manage ATCOs', href: '/officer/assignments', icon: Users },
            { label: 'Course Planning', href: '/officer/planning', icon: Calendar },
            { label: 'Training Content', href: '/officer/content', icon: BookOpen },
            { label: 'Manual Grading', href: '/officer/grading', icon: CheckSquare },
            { label: 'Exam Results', href: '/officer/results', icon: FileText },
        ],
        head_of_training: [
            { label: 'Supervision', href: '/head', icon: LayoutDashboard },
            { label: 'Global Sessions', href: '/head/sessions', icon: Calendar },
            { label: 'Staff Overview', href: '/head/staff', icon: Users },
            { label: 'Audit Logs', href: '/head/audit', icon: ClipboardList },
        ],
        admin: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'Courses', href: '/admin/courses', icon: BookOpen },
            { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
            { label: 'Locations', href: '/admin/locations', icon: MapPin },
        ],
        instructor: [
            { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
            { label: 'Sessions', href: '/instructor/sessions', icon: Calendar },
        ]
    }

    const items = navItems[role] || []

    return (
        <>
            {/* Mobile Header (Visible below XL) */}
            <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 z-[60] flex items-center justify-between px-6">
                <div className="flex flex-col">
                    <span className="text-white font-black tracking-tighter text-lg leading-none">FANS PORTAL</span>
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">{role.replace('_', ' ')}</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 min-w-[48px] min-h-[48px] text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-all active:scale-95 hover:bg-zinc-800 touch-manipulation flex items-center justify-center"
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay for mobile (Visible below XL) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] xl:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-[80] w-72 xl:w-80 bg-zinc-900/95 xl:bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen transition-all duration-500 ease-in-out transform xl:translate-x-0 xl:static xl:inset-0 xl:z-0 xl:shadow-none backdrop-blur-xl xl:backdrop-blur-none",
                isOpen ? "translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]" : "-translate-x-full"
            )}>
                <div className="p-8 pb-6">
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">FANS PORTAL</h1>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-[0.2em]">{role.replace('_', ' ')}</p>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                    {items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-4 min-h-[52px] rounded-2xl text-[13px] font-bold transition-all relative group touch-manipulation active:scale-[0.98]",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-zinc-500 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-800"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-active:scale-105", isActive ? "text-white" : "text-zinc-600 group-hover:text-blue-500")} />
                                {item.label}
                                {isActive && (
                                    <span className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-6 border-t border-zinc-800/50">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-4 w-full px-5 py-4 min-h-[52px] rounded-2xl text-[13px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-400/10 active:bg-red-400/20 transition-all group touch-manipulation active:scale-[0.98]"
                        aria-label="Sign Out"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 group-active:scale-105 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}

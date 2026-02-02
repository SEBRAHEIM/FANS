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
    FileText,
    Library,
    Layout
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
            { label: 'Training History', href: '/atco/trainings', icon: BookOpen },
            { label: 'Test Results', href: '/atco/results', icon: FileText },
            { label: 'Assessments', href: '/atco/assessments', icon: CheckSquare },
            { label: 'Resource Library', href: '/atco/library', icon: Library },
        ],
        training_officer: [
            { label: 'Dashboard', href: '/officer', icon: LayoutDashboard },
            { label: 'Manage ATCOs', href: '/officer/assignments', icon: Users },
            { label: 'Course Planning', href: '/officer/planning', icon: Calendar },
            { label: 'Training Content', href: '/officer/content', icon: BookOpen },
            { label: 'Manual Grading', href: '/officer/grading', icon: CheckSquare },
            { label: 'Exam Results', href: '/officer/results', icon: FileText },
            { label: 'Library Architect', href: '/officer/library', icon: Layout },
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
            {/* Mobile Header (Visible below LG) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-2xl border-b border-white/5 z-[60] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                        <Library className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black tracking-tighter text-sm uppercase leading-none">FANS Academy</span>
                        <span className="text-[8px] font-black text-blue-500/80 uppercase tracking-[0.2em] mt-1">{role.replace('_', ' ')}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 min-w-[48px] min-h-[48px] text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-all active:scale-95 hover:bg-zinc-800 touch-manipulation flex items-center justify-center"
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay for mobile (Visible below LG) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-[80] w-72 lg:w-80 bg-zinc-900/95 lg:bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen transition-all duration-500 ease-in-out transform lg:translate-x-0 lg:static lg:inset-0 lg:z-0 lg:shadow-none backdrop-blur-xl lg:backdrop-blur-none",
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
                                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                                        : "text-zinc-500 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-800"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-active:scale-105", isActive ? "text-blue-500 drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]" : "text-zinc-600 group-hover:text-blue-500")} />
                                {item.label}
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(37,99,235,1)]" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-6 border-t border-white/5 mt-auto">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-4 w-full px-5 py-4 min-h-[52px] rounded-2xl text-[13px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-400/5 active:bg-red-400/10 transition-all group touch-manipulation active:scale-[0.98] border border-transparent hover:border-red-400/20"
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

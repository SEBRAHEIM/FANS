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
    Layout,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import FansLogo from './FansLogo'

interface SidebarProps {
    role: 'atco' | 'training_officer' | 'head_of_training' | 'admin' | 'instructor'
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)

    const isLibraryRoute = pathname?.includes('/library')

    // Close sidebar on navigation and on mount to ensure it's closed on mobile
    useEffect(() => {
        setIsOpen(false)
        // Reset collapse when leaving library routes
        if (!isLibraryRoute) setIsCollapsed(false)
    }, [pathname, isLibraryRoute])

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
            <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-zinc-950/60 backdrop-blur-3xl border-b border-white/5 z-[60] flex items-center justify-between px-6 pt-[env(safe-area-inset-top,0px)]">
                <div className="flex items-center gap-3">
                    <FansLogo className="h-10 w-auto" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#E21E26] uppercase tracking-[0.2em]">{role.replace('_', ' ')}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3.5 min-w-[52px] min-h-[52px] text-white bg-white/5 border border-white/10 rounded-2xl transition-all active:scale-90 hover:bg-white/10 touch-manipulation flex items-center justify-center shadow-xl"
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
                "fixed inset-y-0 left-0 z-[80] bg-zinc-950/95 lg:bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform lg:static lg:inset-0 lg:z-0 lg:shadow-none backdrop-blur-3xl lg:backdrop-blur-none",
                isOpen ? "translate-x-0 shadow-[40px_0_100px_-20px_rgba(0,0,0,0.8)]" : "-translate-x-full lg:translate-x-0",
                isCollapsed ? "lg:w-0 border-r-0" : "w-[85vw] max-w-72 lg:w-80"
            )}>
                {/* Pull Handle - Fixed visibility and interaction */}
                {isLibraryRoute && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "hidden lg:flex absolute top-12 -right-4 w-8 h-12 bg-zinc-900 border border-zinc-800 rounded-r-xl items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all z-[100] group active:scale-95 shadow-[10px_0_30px_rgba(37,99,235,0.1)]",
                            isCollapsed ? "left-0 rounded-l-none" : ""
                        )}
                        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 group-hover:scale-125 transition-transform text-blue-500" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 group-hover:scale-125 transition-transform" />
                        )}
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors rounded-r-xl" />
                    </button>
                )}

                <div className={cn("flex flex-col h-full w-72 lg:w-80 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden", isCollapsed ? "opacity-0 pointer-events-none translate-x-[-20px]" : "opacity-100 translate-x-0")}>
                    <div className="p-8 pb-6 border-b border-white/5 mb-4">
                        <div className="mb-4">
                            <FansLogo className="h-12 w-auto" />
                            <p className="text-[10px] font-bold text-[#7BB8E0] uppercase tracking-[0.2em] mt-2">{role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                        {items.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    onClick={() => {
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "flex items-center gap-4 px-5 py-4 min-h-[52px] rounded-2xl text-[13px] font-bold transition-all relative group touch-manipulation active:scale-[0.98] active:bg-[#7BB8E0]/10",
                                        isActive
                                            ? "bg-[#7BB8E0]/10 text-[#7BB8E0] border border-[#7BB8E0]/20 shadow-[0_0_20px_rgba(123,184,224,0.15)]"
                                            : "text-zinc-500 hover:text-white hover:bg-zinc-800/50 active:text-[#7BB8E0]"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-active:scale-105", isActive ? "text-[#E21E26] drop-shadow-[0_0_8px_rgba(226,30,38,0.8)]" : "text-zinc-600 group-hover:text-[#7BB8E0]")} />
                                    {item.label}
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-[#E21E26] rounded-r-full shadow-[0_0_15px_rgba(226,30,38,1)]" />
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
                </div>
            </aside>
        </>
    )
}

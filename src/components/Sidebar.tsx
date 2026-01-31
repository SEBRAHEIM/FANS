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
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    role: 'atco' | 'training_officer' | 'head_of_training' | 'admin'
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
            { label: 'Assessments', href: '/atco/assessments', icon: CheckSquare },
        ],
        training_officer: [
            { label: 'Dashboard', href: '/officer', icon: LayoutDashboard },
            { label: 'Assign OJTIs', href: '/officer/assignments', icon: Users },
            { label: 'Course Planning', href: '/officer/planning', icon: Calendar },
            { label: 'Training Content', href: '/officer/content', icon: BookOpen },
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
            {/* Mobile Toggle Button (Visible below XL) */}
            <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900 z-[60] flex items-center justify-between px-6">
                <span className="text-white font-black tracking-tighter">FANS</span>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-white hover:bg-zinc-900 rounded-xl transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay for mobile (Visible below XL) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] xl:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-[80] w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen transition-all duration-500 ease-in-out xl:translate-x-0 xl:static xl:inset-0 xl:z-0",
                isOpen ? "translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]" : "-translate-x-full"
            )}>
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white tracking-tight">FANS Portal</h1>
                    <p className="text-xs text-zinc-500 uppercase mt-1 tracking-widest">{role.replace('_', ' ')}</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-500"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}

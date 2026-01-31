'use client'

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
    ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    role: 'atco' | 'training_officer' | 'head_of_training' | 'admin'
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()

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
        // Keeping old roles for compatibility during transition
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
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold text-white tracking-tight">FANS Portal</h1>
                <p className="text-xs text-zinc-500 uppercase mt-1 tracking-widest">{role}</p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600/10 text-blue-500"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}

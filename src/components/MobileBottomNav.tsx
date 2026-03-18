'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Library,
    Users,
    Settings,
    CheckSquare,
    Calendar,
    Layout
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
    label: string
    href: string
    icon: any
}

interface MobileBottomNavProps {
    role: 'atco' | 'training_officer' | 'head_of_training' | 'admin' | 'instructor'
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
    const pathname = usePathname()

    const navItems: Record<string, NavItem[]> = {
        atco: [
            { label: 'Home', href: '/atco', icon: LayoutDashboard },
            // { label: 'Courses', href: '/atco/trainings', icon: BookOpen },
            { label: 'Schedule', href: '/atco/calendar', icon: Calendar },
            // { label: 'Results', href: '/atco/results', icon: FileText },
        ],
        training_officer: [
            { label: 'Home', href: '/officer', icon: LayoutDashboard },
            { label: 'ATCOs', href: '/officer/assignments', icon: Users },
            // { label: 'Training', href: '/officer/content', icon: BookOpen },
            // { label: 'Assessments', href: '/officer/assessments', icon: CheckSquare },
        ],
        admin: [
            { label: 'Home', href: '/admin', icon: LayoutDashboard },
            { label: 'Courses', href: '/admin/courses', icon: BookOpen },
            { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
        ],
        instructor: [
            { label: 'Home', href: '/instructor', icon: LayoutDashboard },
            { label: 'Sessions', href: '/instructor/sessions', icon: Calendar },
        ],
        head_of_training: [
            { label: 'Home', href: '/head', icon: LayoutDashboard },
            { label: 'Sessions', href: '/head/sessions', icon: Calendar },
            { label: 'Staff', href: '/head/staff', icon: Users },
            { label: 'Audit', href: '/head/audit', icon: FileText },
        ]
    }

    const items = navItems[role] || []

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 px-4 pb-[env(safe-area-inset-bottom,1.5rem)] pt-3 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
            {items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all relative group touch-manipulation active:scale-90",
                            isActive ? "text-blue-500 scale-105" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <div className={cn(
                            "transition-all duration-300 flex items-center justify-center",
                            isActive ? "drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]" : ""
                        )}>
                            <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest leading-none transition-all",
                            isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                        )}>
                            {item.label}
                        </span>

                        {isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-in fade-in zoom-in duration-300" />
                        )}
                    </Link>
                )
            })}
        </nav>
    )
}

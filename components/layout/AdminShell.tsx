'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store/authStore'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  Globe,
  Settings,
  LogOut,
  ChevronRight,
  Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PendingReviewsBadge } from './PendingReviewsBadge'
import { CommandPalette } from './CommandPalette'
import { useState } from 'react'
import type { ReactNode } from 'react'

type ShellUser = {
  name: string
  email: string
  schoolId: string
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: ReactNode
  exact?: boolean
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium dark:bg-gray-800 dark:text-gray-50'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge}
      {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
    </Link>
  )
}

export function AdminShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [paletteOpen, setPaletteOpen] = useState(false)

  async function handleLogout() {
    clearAuth()
    queryClient.clear()
    await signOut({ redirect: false })
    router.push('/login')
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Courses',
      href: '/admin/courses',
      icon: BookOpen,
      badge: <PendingReviewsBadge schoolId={user.schoolId} />,
    },
    {
      label: 'Instructors',
      href: '/admin/instructors',
      icon: Users,
    },
    {
      label: 'Students',
      href: '/admin/students',
      icon: GraduationCap,
    },
    {
      label: 'Enrollments',
      href: '/admin/enrollments',
      icon: ClipboardList,
    },
    {
      label: 'Translations',
      href: '/admin/translations',
      icon: Globe,
    },
  ]

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
        {/* Sidebar */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          {/* Logo */}
          <div className="flex h-12 items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 px-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#012c4f] text-white text-xs font-bold shrink-0">
                N
              </div>
              <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50 truncate">
                NGV
              </span>
            </Link>
            <span className="ml-auto text-[10px] font-medium text-gray-400 uppercase tracking-wide shrink-0">
              Admin
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-2 space-y-0.5">
            <NavLink
              item={{
                label: 'Settings',
                href: '/admin/settings',
                icon: Settings,
              }}
            />

            {/* Cmd+K hint */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <Command className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">Command palette</span>
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-300 font-mono">
                <span>⌘</span>
                <span>K</span>
              </kbd>
            </button>

            {/* User */}
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 mt-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}

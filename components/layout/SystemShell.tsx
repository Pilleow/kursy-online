'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield,
  Building2,
  CreditCard,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/authStore'
import type { ReactNode } from 'react'

type ShellUser = {
  name: string
  email: string
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
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
          ? 'bg-gray-800 text-white font-medium'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
    </Link>
  )
}

const navItems: NavItem[] = [
  { label: 'Schools', href: '/system/schools', icon: Building2 },
  { label: 'Plans', href: '/system/plans', icon: CreditCard },
]

export function SystemShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    clearAuth()
    window.location.href = '/system/login'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-800">
        {/* Logo */}
        <div className="flex h-12 items-center gap-2.5 border-b border-gray-800 px-4">
          <Shield className="h-5 w-5 text-red-400 shrink-0" />
          <span className="text-sm font-semibold tracking-tight truncate">NGV</span>
          <span className="ml-auto text-[10px] font-medium text-red-400 uppercase tracking-wide">
            System
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-800 px-2 py-2">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-900 text-[10px] font-semibold text-red-200">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Audit log notice */}
        <div className="border-t border-gray-800 px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-gray-500 leading-tight">
            All actions in this panel are logged.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}

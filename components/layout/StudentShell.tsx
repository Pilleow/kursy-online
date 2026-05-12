'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/authStore'
import type { ReactNode } from 'react'

type ShellUser = {
  name: string
  email: string
  image: string | null
}

type StudentShellProps = {
  user: ShellUser
  breadcrumb?: ReactNode
  children: ReactNode
}

export function StudentShell({ user, breadcrumb, children }: StudentShellProps) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    if (accessToken) return
    // Silently exchange the httpOnly refresh_token cookie for a new access token,
    // then fetch /me to populate the Zustand store for client-side API calls.
    async function silentRefresh() {
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', { method: 'POST' })
        if (!refreshRes.ok) return
        const { accessToken: newToken } = await refreshRes.json()

        const meRes = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${newToken}` },
        })
        if (!meRes.ok) return
        const { user: u, membership } = await meRes.json()

        setAuth(u, newToken, membership?.schoolId ?? null, membership?.role ?? null)
      } catch {
        // Non-critical — page will stay unauthenticated and API calls will 401
      }
    }
    silentRefresh()
  }, [accessToken, setAuth])

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                E
              </div>
              <span className="text-base font-semibold tracking-tight text-gray-900">EduFlow</span>
            </Link>

            {breadcrumb && (
              <>
                <span className="text-gray-300 select-none">/</span>
                <div className="flex items-center">{breadcrumb}</div>
              </>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 h-9 px-2.5 rounded-lg hover:bg-gray-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 shrink-0">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate hidden sm:block">
                  {user.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  )
}

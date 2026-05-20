import Link from 'next/link'
import type { ReactNode } from 'react'
import { auth } from '@/lib/server/auth'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const loggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-[#012c4f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            NGV
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm font-medium px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Dashboard
            </Link>
            {!loggedIn && (
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-2 rounded-md border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

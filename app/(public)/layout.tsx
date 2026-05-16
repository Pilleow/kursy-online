import Link from 'next/link'
import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            EduFlow
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Login
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

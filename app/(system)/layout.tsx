import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { SystemShell } from '@/components/layout/SystemShell'
import type { ReactNode } from 'react'

async function getSystemSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-me',
    )
    const { payload } = await jwtVerify(token, secret)
    if (!payload.isSystemAdmin) return null
    return payload as { sub: string; name?: string; email?: string; isSystemAdmin: boolean }
  } catch {
    return null
  }
}

export default async function SystemLayout({ children }: { children: ReactNode }) {
  const user = await getSystemSession()
  if (!user) redirect('/system/login')

  return (
    <SystemShell user={{ name: user.name ?? 'System Admin', email: user.email ?? '' }}>
      {children}
    </SystemShell>
  )
}

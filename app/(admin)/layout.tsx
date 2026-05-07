import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { AdminShell } from '@/components/layout/AdminShell'
import type { ReactNode } from 'react'

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-me',
    )
    const { payload } = await jwtVerify(token, secret)
    return payload as {
      sub: string
      name?: string
      email?: string
      role?: string
      schoolId?: string
    }
  } catch {
    return null
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()

  if (!user) redirect('/login')
  if (user.role !== 'school_admin') redirect('/dashboard')

  return (
    <AdminShell
      user={{
        name: user.name ?? 'Admin',
        email: user.email ?? '',
        schoolId: user.schoolId ?? '',
      }}
    >
      {children}
    </AdminShell>
  )
}

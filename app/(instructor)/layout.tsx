import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { InstructorShell } from '@/components/layout/InstructorShell'
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

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()

  if (!user) redirect('/login')
  if (user.role !== 'instructor' && user.role !== 'school_admin') redirect('/dashboard')

  return (
    <InstructorShell
      user={{
        name: user.name ?? 'Instructor',
        email: user.email ?? '',
      }}
    >
      {children}
    </InstructorShell>
  )
}

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { withSystemAdmin } from '@/lib/server/middleware/withSystemAdmin'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { z } from 'zod'

function getId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  return segments[segments.indexOf('schools') + 1] ?? ''
}

const getHandler = withSystemAdmin(async (req) => {
  const id = getId(req)

  const school = await db.school.findUnique({
    where: { id },
    include: {
      plan: true,
      memberships: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { role: 'asc' },
      },
      _count: { select: { courses: true, memberships: true, enrollments: true } },
    },
  })

  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  return NextResponse.json(school)
})

const PatchSchema = z.object({ isActive: z.boolean() })

const patchHandler = withSystemAdmin(async (req) => {
  const id = getId(req)
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const school = await db.school.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
    include: { plan: true, _count: { select: { courses: true, memberships: true, enrollments: true } } },
  })

  return NextResponse.json(school)
})

export const GET = withLogging(getHandler)
export const PATCH = withLogging(patchHandler)

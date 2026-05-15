import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { z } from 'zod'

const PatchRoleSchema = z.object({
  role: z.enum(['school_admin', 'instructor', 'student']),
})

function getMemberUserId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('members')
  return segments[idx + 1] ?? ''
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const targetUserId = getMemberUserId(req)

  const membership = await tx.schoolMembership.findUnique({
    where: { schoolId_userId: { schoolId, userId: targetUserId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = PatchRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const updated = await tx.schoolMembership.update({
    where: { schoolId_userId: { schoolId, userId: targetUserId } },
    data: { role: parsed.data.role },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  })

  return NextResponse.json(updated)
}

export const PATCH = withLogging(compose('school_admin')(patchHandler))

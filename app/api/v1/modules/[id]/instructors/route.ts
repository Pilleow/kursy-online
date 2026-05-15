import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { ReplaceInstructorsSchema } from '@/lib/schemas/module'

function getModuleId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('modules')
  return segments[idx + 1] ?? ''
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const moduleId = getModuleId(req)

  const found = await tx.module.findFirst({ where: { id: moduleId, schoolId } })
  if (!found) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ReplaceInstructorsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { instructorIds } = parsed.data

  // Verify all users are instructors within this school.
  if (instructorIds.length > 0) {
    const memberships = await tx.schoolMembership.findMany({
      where: {
        userId: { in: instructorIds },
        schoolId,
        role: 'instructor',
      },
      select: { userId: true },
    })

    if (memberships.length !== instructorIds.length) {
      return NextResponse.json(
        { error: 'One or more users are not instructors in this school' },
        { status: 422 },
      )
    }
  }

  // Replace all assignments in a single transaction (already inside withTenant tx).
  await tx.moduleAssignment.deleteMany({ where: { moduleId } })

  if (instructorIds.length > 0) {
    await tx.moduleAssignment.createMany({
      data: instructorIds.map((instructorId) => ({ moduleId, instructorId, schoolId })),
    })
  }

  const assignments = await tx.moduleAssignment.findMany({
    where: { moduleId },
    select: { instructorId: true, createdAt: true },
  })

  return NextResponse.json(assignments)
}

export const PATCH = withLogging(compose('school_admin')(patchHandler))

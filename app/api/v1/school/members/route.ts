import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (req: NextRequest, ctx) => {
  const { schoolId, tx } = ctx
  const role = req.nextUrl.searchParams.get('role') ?? undefined

  const members = await tx.schoolMembership.findMany({
    where: {
      schoolId,
      ...(role ? { role: role as 'school_admin' | 'instructor' | 'student' } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          enrollments: {
            where: { schoolId },
            select: { id: true, enrolledAt: true },
          },
          lessonProgresses: {
            where: { schoolId, completed: true },
            select: { completedAt: true },
            orderBy: { completedAt: 'desc' },
            take: 1,
          },
          moduleAssignments: {
            where: { schoolId },
            select: { moduleId: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(members)
}

export const GET = withLogging(compose('school_admin')(getHandler))

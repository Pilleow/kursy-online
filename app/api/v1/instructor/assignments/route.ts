import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx, userId } = ctx

  const assignments = await tx.moduleAssignment.findMany({
    where: { instructorId: userId!, schoolId },
    include: {
      module: {
        include: {
          course: { select: { id: true, title: true } },
          _count: { select: { lessons: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(
    assignments.map((a) => ({
      assignmentId: a.id,
      module: a.module,
    })),
  )
}

export const GET = withLogging(compose('instructor')(withTenant(getHandler)))

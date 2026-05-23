import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, userId, tx } = ctx

  // Scope counts to only the modules this instructor is assigned to.
  const assignments = await tx.moduleAssignment.findMany({
    where: { instructorId: userId!, schoolId },
    select: { moduleId: true },
  })
  const moduleIds = assignments.map((a) => a.moduleId)

  if (moduleIds.length === 0) {
    return NextResponse.json({ pendingHomeworkCount: 0, unreadQACount: 0 })
  }

  const [pendingHomeworkCount, unreadQACount] = await Promise.all([
    tx.homeworkSubmission.count({
      where: {
        schoolId,
        feedback: null,
        homework: { lesson: { moduleId: { in: moduleIds } } },
      },
    }),
    tx.qAQuestion.count({
      where: {
        schoolId,
        answer: null,
        lesson: { moduleId: { in: moduleIds } },
      },
    }),
  ])

  return NextResponse.json({ pendingHomeworkCount, unreadQACount })
}

export const GET = withLogging(compose('instructor')(withTenant(getHandler)))

import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const [pendingHomeworkCount, unreadQACount] = await Promise.all([
    tx.homeworkSubmission.count({ where: { schoolId, score: null } }),
    tx.qAQuestion.count({ where: { schoolId, answer: null } }),
  ])

  return NextResponse.json({ pendingHomeworkCount, unreadQACount })
}

export const GET = withLogging(compose('instructor')(withTenant(getHandler)))

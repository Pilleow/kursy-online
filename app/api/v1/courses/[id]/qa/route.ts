import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx
  const courseId = getCourseId(req)

  const questions = await tx.qAQuestion.findMany({
    where: {
      schoolId,
      lesson: { module: { courseId } },
    },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      upvoteRecords: userId ? { where: { userId }, select: { id: true } } : false,
      lesson: {
        select: {
          id: true,
          title: true,
          module: { select: { id: true, title: true } },
        },
      },
    },
  })

  const result = questions.map(({ upvoteRecords, lesson, ...q }) => ({
    ...q,
    hasUpvoted: userId ? (upvoteRecords as { id: string }[]).length > 0 : false,
    lessonTitle: lesson.title,
    moduleTitle: lesson.module.title,
  }))

  return NextResponse.json(result)
}

export const GET = withLogging(compose('instructor')(getHandler))

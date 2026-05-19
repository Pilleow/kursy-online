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
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)

  const questions = await tx.qAQuestion.findMany({
    where: {
      schoolId,
      answer: null,
      lesson: { module: { courseId } },
    },
    select: { lessonId: true },
  })

  const counts: Record<string, number> = {}
  for (const q of questions) {
    counts[q.lessonId] = (counts[q.lessonId] ?? 0) + 1
  }

  return NextResponse.json(counts)
}

export const GET = withLogging(compose('instructor')(getHandler))

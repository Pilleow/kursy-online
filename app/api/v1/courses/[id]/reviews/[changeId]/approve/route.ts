import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import type { Prisma } from '@/src/generated/prisma/client'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

function getChangeId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('reviews')
  return segments[idx + 1] ?? ''
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)
  const changeId = getChangeId(req)

  const review = await tx.contentReview.findFirst({
    where: { id: changeId, courseId, schoolId },
  })
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }
  if (review.status !== 'pending') {
    return NextResponse.json({ error: 'Review is no longer pending' }, { status: 422 })
  }

  const [updatedReview] = await Promise.all([
    tx.contentReview.update({
      where: { id: changeId },
      data: { status: 'approved', reviewedAt: new Date() },
    }),
    tx.lesson.update({
      where: { id: review.lessonId },
      data: { blocks: review.changeSnapshot as Prisma.InputJsonValue, status: 'published' },
    }),
  ])

  return NextResponse.json(updatedReview)
}

export const POST = withLogging(compose('school_admin')(postHandler))

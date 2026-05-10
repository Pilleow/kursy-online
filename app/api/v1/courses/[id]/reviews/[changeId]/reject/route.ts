import 'server-only'

import { z } from 'zod'
import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const RejectBody = z.object({
  comment: z.string().min(1),
})

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

  const body = await req.json().catch(() => null)
  const parsed = RejectBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const [updatedReview] = await Promise.all([
    tx.contentReview.update({
      where: { id: changeId },
      data: { status: 'rejected', reviewerComment: parsed.data.comment, reviewedAt: new Date() },
    }),
    tx.lesson.update({
      where: { id: review.lessonId },
      data: { status: 'draft' },
    }),
  ])

  return NextResponse.json(updatedReview)
}

export const POST = withLogging(compose('school_admin')(postHandler))

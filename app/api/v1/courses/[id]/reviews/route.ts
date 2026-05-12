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

  const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const reviews = await tx.contentReview.findMany({
    where: { courseId, schoolId, status: 'pending' },
    include: {
      lesson: { select: { id: true, title: true, blocks: true } },
      instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(reviews)
}

export const GET = withLogging(compose('school_admin')(getHandler))

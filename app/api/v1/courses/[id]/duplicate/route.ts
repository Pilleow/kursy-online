import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import { type TenantHandler } from '@/lib/server/middleware/withTenant'
import { duplicationQueue } from '@/lib/server/queue'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const duplicateHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, userId, tx } = ctx
  const id = getCourseId(req)

  const course = await tx.course.findFirst({ where: { id, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const newTitle = `Copy of ${course.title}`

  const job = await tx.job.create({
    data: {
      schoolId,
      userId: userId!,
      type: 'course_duplicate',
      status: 'pending',
      payload: { sourceCourseId: id, newTitle, schoolId, requesterId: userId! },
    },
  })

  await duplicationQueue.add(job.id, {
    sourceCourseId: id,
    newTitle,
    schoolId,
    requesterId: userId!,
  })

  return NextResponse.json({ jobId: job.id }, { status: 202 })
}

export const POST = withLogging(compose('school_admin')(duplicateHandler))

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

function getTargetUserId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('access')
  return segments[idx + 1] ?? ''
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)
  const userId = getTargetUserId(req)

  const enrollment = await tx.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  if (!enrollment || enrollment.schoolId !== schoolId) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  await tx.enrollment.delete({ where: { courseId_userId: { courseId, userId } } })

  return new NextResponse(null, { status: 204 })
}

export const DELETE = withLogging(compose('school_admin')(deleteHandler))

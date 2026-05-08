import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import { type TenantHandler } from '@/lib/server/middleware/withTenant'
import { redis } from '@/lib/server/redis'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const publishHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCourseId(req)

  const course = await tx.course.findFirst({ where: { id, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const nextStatus = course.status === 'published' ? 'draft' : 'published'

  const updated = await tx.course.update({
    where: { id },
    data: { status: nextStatus },
  })

  await redis.del(`courses:${schoolId}`)

  return NextResponse.json(updated)
}

export const POST = withLogging(compose('school_admin')(publishHandler))

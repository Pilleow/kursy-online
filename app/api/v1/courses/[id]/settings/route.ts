import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import { type TenantHandler } from '@/lib/server/middleware/withTenant'
import { CourseSettingsSchema } from '@/lib/schemas/course'
import { redis } from '@/lib/server/redis'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const settingsHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCourseId(req)

  const existing = await tx.course.findFirst({ where: { id, schoolId } })
  if (!existing) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CourseSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { price, accessDurationDays, completionRequirements } = parsed.data

  const course = await tx.course.update({
    where: { id },
    data: {
      priceUsd: price,
      accessDurationDays: accessDurationDays ?? null,
      completionRequirements,
    },
  })

  await redis.del(`courses:${schoolId}`)

  return NextResponse.json(course)
}

export const PATCH = withLogging(compose('school_admin')(settingsHandler))

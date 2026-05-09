import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { ReorderLessonsSchema } from '@/lib/schemas/lesson'

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  const parsed = ReorderLessonsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { lessonIds } = parsed.data

  const lessons = await tx.lesson.findMany({
    where: { id: { in: lessonIds }, schoolId },
    select: { id: true, position: true },
  })

  if (lessons.length !== lessonIds.length) {
    return NextResponse.json({ error: 'One or more lessons not found' }, { status: 404 })
  }

  const slots = lessons.map((l) => l.position).sort((a, b) => a - b)

  await Promise.all(
    lessonIds.map((id, i) => tx.lesson.update({ where: { id }, data: { position: slots[i] } })),
  )

  return new NextResponse(null, { status: 204 })
}

export const PATCH = withLogging(compose('school_admin')(patchHandler))

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

function getLessonId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('lessons')
  return segments[idx + 1] ?? ''
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const id = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id, schoolId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  if (role === 'instructor') {
    const assignment = await tx.moduleAssignment.findUnique({
      where: {
        moduleId_instructorId: { moduleId: lesson.moduleId, instructorId: userId! },
      },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
    }
  }

  if (lesson.status !== 'draft') {
    return NextResponse.json(
      { error: 'Lesson must be in draft status to submit for review' },
      { status: 422 },
    )
  }

  const updated = await tx.lesson.update({
    where: { id },
    data: { status: 'pending_review' },
  })

  return NextResponse.json(updated)
}

export const POST = withLogging(compose('instructor')(postHandler))

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

/** POST /api/v1/lessons/:id/quizzes — create or return the existing quiz for a lesson */
const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const lessonId = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id: lessonId, schoolId } })
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

  const existing = await tx.quiz.findUnique({ where: { lessonId } })
  if (existing) {
    return NextResponse.json(existing)
  }

  const quiz = await tx.quiz.create({
    data: { lessonId, schoolId, title: lesson.title },
  })

  return NextResponse.json(quiz, { status: 201 })
}

export const POST = withLogging(compose('instructor')(postHandler))

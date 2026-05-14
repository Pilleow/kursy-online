import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

function getLessonId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('lessons')
  return segments[idx + 1] ?? ''
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const lessonId = getLessonId(req)

  const lesson = await tx.lesson.findFirst({
    where: { id: lessonId, schoolId },
    include: {
      module: { select: { courseId: true } },
      quiz: { select: { id: true } },
      homework: { select: { id: true } },
    },
  })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const { courseId } = lesson.module

  const enrollment = await tx.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
  }

  if (lesson.type === 'quiz') {
    if (!lesson.quiz) {
      return NextResponse.json({ error: 'Quiz not configured for this lesson' }, { status: 422 })
    }
    const passingAttempt = await tx.quizAttempt.findFirst({
      where: { quizId: lesson.quiz.id, userId, schoolId, passed: true },
    })
    if (!passingAttempt) {
      return NextResponse.json({ error: 'Must pass the quiz to complete this lesson' }, { status: 422 })
    }
  }

  if (lesson.type === 'homework') {
    if (!lesson.homework) {
      return NextResponse.json({ error: 'Homework not configured for this lesson' }, { status: 422 })
    }
    const submission = await tx.homeworkSubmission.findUnique({
      where: { homeworkId_userId: { homeworkId: lesson.homework.id, userId } },
    })
    if (!submission) {
      return NextResponse.json({ error: 'Must submit homework to complete this lesson' }, { status: 422 })
    }
  }

  await tx.lessonProgress.upsert({
    where: { lessonId_userId: { lessonId, userId } },
    create: { lessonId, userId, schoolId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  })

  return NextResponse.json({ isCompleted: true })
}

export const POST = withLogging(withAuth(withTenant(postHandler)))

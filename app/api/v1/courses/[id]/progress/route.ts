import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

type CompletionRequirements = {
  requireAllLessons?: boolean
  minimumQuizScore?: number
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const courseId = getCourseId(req)

  const course = await tx.course.findFirst({
    where: { id: courseId, schoolId },
    include: {
      modules: {
        include: {
          lessons: {
            where: { status: 'published' },
            include: { quiz: { select: { id: true } } },
          },
        },
      },
    },
  })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const publishedLessons = course.modules.flatMap((m) => m.lessons)
  const totalLessons = publishedLessons.length
  const publishedLessonIds = publishedLessons.map((l) => l.id)

  const progressRecords = await tx.lessonProgress.findMany({
    where: { lessonId: { in: publishedLessonIds }, userId, schoolId, completed: true },
    select: { lessonId: true },
  })

  const completedLessonIds = progressRecords.map((p) => p.lessonId)
  const completedLessons = completedLessonIds.length
  const percentComplete =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const requirements = course.completionRequirements as CompletionRequirements

  // Default: complete when all published lessons are done
  let meetsLessons = totalLessons > 0 && completedLessons === totalLessons
  let meetsScore = true

  if (requirements.requireAllLessons) {
    meetsLessons = totalLessons > 0 && completedLessons === totalLessons
  }

  if (requirements.minimumQuizScore != null) {
    const quizIds = publishedLessons
      .filter((l) => l.quiz != null)
      .map((l) => l.quiz!.id)

    if (quizIds.length > 0) {
      const attempts = await tx.quizAttempt.findMany({
        where: { quizId: { in: quizIds }, userId, schoolId },
        select: { quizId: true, score: true },
        orderBy: { createdAt: 'desc' },
      })

      // Best score per quiz
      const bestScores = new Map<string, number>()
      for (const attempt of attempts) {
        const current = bestScores.get(attempt.quizId)
        if (current === undefined || attempt.score > current) {
          bestScores.set(attempt.quizId, attempt.score)
        }
      }

      const scores = Array.from(bestScores.values())
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      meetsScore = avg >= requirements.minimumQuizScore
    } else {
      meetsScore = true
    }
  }

  const isComplete = meetsLessons && meetsScore

  return NextResponse.json({
    totalLessons,
    completedLessons,
    percentComplete,
    completedLessonIds,
    isComplete,
  })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

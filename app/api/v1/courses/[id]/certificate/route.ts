import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { certificateQueue } from '@/lib/server/queue'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

type CompletionRequirements = {
  requireAllLessons?: boolean
  minimumQuizScore?: number
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const courseId = getCourseId(req)

  const enrollment = await tx.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
  }

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

  const completedLessons = progressRecords.length
  const requirements = course.completionRequirements as CompletionRequirements

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
    }
  }

  const isComplete = meetsLessons && meetsScore
  if (!isComplete) {
    return NextResponse.json({ error: 'Course not yet completed' }, { status: 422 })
  }

  // Idempotent: if a certificate already exists, return it
  const existing = await tx.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (existing) {
    return NextResponse.json({ certificateId: existing.id }, { status: 200 })
  }

  const certificate = await tx.certificate.create({
    data: { userId, courseId, schoolId },
  })

  const job = await tx.job.create({
    data: {
      schoolId,
      userId,
      type: 'certificate_generation',
      status: 'pending',
      payload: {
        studentId: userId,
        courseId,
        enrollmentId: enrollment.id,
        certificateId: certificate.id,
      },
    },
  })

  await certificateQueue.add(job.id, {
    studentId: userId,
    courseId,
    enrollmentId: enrollment.id,
  })

  return NextResponse.json({ jobId: job.id }, { status: 202 })
}

export const POST = withLogging(withAuth(withTenant(postHandler)))

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

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)

  const course = await tx.course.findFirst({
    where: { id: courseId, schoolId },
    include: {
      modules: {
        include: {
          lessons: {
            where: { status: 'published' },
            select: { id: true },
          },
        },
      },
    },
  })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const publishedLessonIds = course.modules.flatMap((m) => m.lessons).map((l) => l.id)
  const totalLessons = publishedLessonIds.length

  const enrollments = await tx.enrollment.findMany({
    where: { courseId, schoolId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  const userIds = enrollments.map((e) => e.userId)
  const progressRecords =
    totalLessons > 0 && userIds.length > 0
      ? await tx.lessonProgress.findMany({
          where: { lessonId: { in: publishedLessonIds }, userId: { in: userIds }, schoolId, completed: true },
          select: { userId: true, lessonId: true },
        })
      : []

  const progressByUser = new Map<string, number>()
  for (const p of progressRecords) {
    progressByUser.set(p.userId, (progressByUser.get(p.userId) ?? 0) + 1)
  }

  const result = enrollments.map((e) => {
    const completedCount = progressByUser.get(e.userId) ?? 0
    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    return {
      userId: e.userId,
      name: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      enrolledAt: e.enrolledAt,
      expiresAt: e.expiresAt,
      progress,
    }
  })

  return NextResponse.json(result)
}

export const GET = withLogging(compose('school_admin')(getHandler))

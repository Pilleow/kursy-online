import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

function getEmail(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('students')
  return decodeURIComponent(segments[idx + 1] ?? '')
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const email = getEmail(req)

  const user = await tx.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const enrollments = await tx.enrollment.findMany({
    where: { userId: user.id, schoolId },
    select: {
      courseId: true,
      enrolledAt: true,
      expiresAt: true,
      completedAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          modules: {
            select: {
              lessons: {
                where: { status: 'published' },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })

  if (enrollments.length === 0) {
    return NextResponse.json({ student: user, courses: [] })
  }

  const allLessonIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  )

  const progressRecords = await tx.lessonProgress.findMany({
    where: { userId: user.id, schoolId, lessonId: { in: allLessonIds }, completed: true },
    select: { lessonId: true },
  })

  const completedSet = new Set(progressRecords.map((p) => p.lessonId))

  const courses = enrollments.map((e) => {
    const publishedLessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
    const totalLessons = publishedLessonIds.length
    const completedLessons = publishedLessonIds.filter((id) => completedSet.has(id)).length
    const percentComplete =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    const isComplete = totalLessons > 0 && completedLessons === totalLessons

    return {
      courseId: e.courseId,
      title: e.course.title,
      slug: e.course.slug,
      enrolledAt: e.enrolledAt,
      expiresAt: e.expiresAt,
      completedAt: e.completedAt,
      totalLessons,
      completedLessons,
      percentComplete,
      isComplete,
    }
  })

  return NextResponse.json({ student: user, courses })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

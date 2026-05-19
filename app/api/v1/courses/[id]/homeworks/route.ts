import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import { type TenantHandler } from '@/lib/server/middleware/withTenant'
import type { NextRequest } from 'next/server'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)

  const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'

  const [homeworks, pendingRaw] = await Promise.all([
    tx.homework.findMany({
      where: {
        schoolId,
        lesson: { module: { courseId } },
        ...(!includeArchived && { archivedAt: null }),
      },
      include: {
        questions: { orderBy: { position: 'asc' } },
        _count: { select: { submissions: true } },
        lesson: { select: { title: true, moduleId: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    tx.homeworkSubmission.findMany({
      where: { schoolId, feedback: null, homework: { lesson: { module: { courseId } } } },
      select: { homeworkId: true },
    }),
  ])

  const pendingByHomework: Record<string, number> = {}
  for (const s of pendingRaw) {
    pendingByHomework[s.homeworkId] = (pendingByHomework[s.homeworkId] ?? 0) + 1
  }

  return NextResponse.json(
    homeworks.map((hw) => ({
      ...hw,
      pendingSubmissionsCount: pendingByHomework[hw.id] ?? 0,
    })),
  )
}

export const GET = withLogging(compose('instructor')(getHandler))

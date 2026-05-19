import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx, userId } = ctx

  const assignments = await tx.moduleAssignment.findMany({
    where: { instructorId: userId!, schoolId },
    include: {
      module: {
        include: {
          course: { select: { id: true, title: true } },
          _count: { select: { lessons: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const moduleIds = assignments.map((a) => a.moduleId)

  const [pendingRaw, unreadRaw] = await Promise.all([
    tx.homeworkSubmission.findMany({
      where: { schoolId, feedback: null, homework: { lesson: { moduleId: { in: moduleIds } } } },
      select: { homework: { select: { lesson: { select: { moduleId: true } } } } },
    }),
    tx.qAQuestion.findMany({
      where: { schoolId, answer: null, lesson: { moduleId: { in: moduleIds } } },
      select: { lesson: { select: { moduleId: true } } },
    }),
  ])

  const pendingByModule: Record<string, number> = {}
  for (const s of pendingRaw) {
    const mid = s.homework.lesson.moduleId
    pendingByModule[mid] = (pendingByModule[mid] ?? 0) + 1
  }
  const unreadByModule: Record<string, number> = {}
  for (const q of unreadRaw) {
    const mid = q.lesson.moduleId
    unreadByModule[mid] = (unreadByModule[mid] ?? 0) + 1
  }

  return NextResponse.json(
    assignments.map((a) => ({
      assignmentId: a.id,
      module: {
        ...a.module,
        pendingHomeworkCount: pendingByModule[a.moduleId] ?? 0,
        unreadQACount: unreadByModule[a.moduleId] ?? 0,
      },
    })),
  )
}

export const GET = withLogging(compose('instructor')(getHandler))

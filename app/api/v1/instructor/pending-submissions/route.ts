import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx, userId } = ctx

  const submissions = await tx.homeworkSubmission.findMany({
    where: {
      schoolId,
      feedback: null,
      homework: {
        lesson: {
          module: {
            assignments: { some: { instructorId: userId!, schoolId } },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      submittedAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
      homework: {
        select: {
          id: true,
          title: true,
          lesson: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  course: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  return NextResponse.json(
    submissions.map((s) => ({
      submissionId: s.id,
      submittedAt: s.submittedAt,
      studentName: `${s.user.firstName} ${s.user.lastName}`,
      courseId: s.homework.lesson.module.course.id,
      courseName: s.homework.lesson.module.course.title,
      lessonId: s.homework.lesson.id,
      lessonTitle: s.homework.lesson.title,
      homeworkId: s.homework.id,
      homeworkTitle: s.homework.title,
    })),
  )
}

export const GET = withLogging(compose('instructor')(getHandler))

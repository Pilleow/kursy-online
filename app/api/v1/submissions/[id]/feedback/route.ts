import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import { type TenantHandler } from '@/lib/server/middleware/withTenant'
import { sendFeedbackEmail } from '@/lib/server/email'
import { z } from 'zod'

function getSubmissionId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('submissions')
  return segments[idx + 1] ?? ''
}

const FeedbackSchema = z.object({
  feedback: z.string().min(1),
})

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx
  const id = getSubmissionId(req)

  const submission = await tx.homeworkSubmission.findFirst({
    where: { id, schoolId },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      homework: {
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: { select: { title: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = FeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const updated = await tx.homeworkSubmission.update({
    where: { id },
    data: {
      feedback: parsed.data.feedback,
      feedbackAt: new Date(),
      instructorId: userId!,
    },
  })

  const { user, homework } = submission
  const courseName = homework.lesson.module.course.title
  const studentName = `${user.firstName} ${user.lastName}`

  await sendFeedbackEmail(user.email, studentName, courseName, parsed.data.feedback).catch(
    () => undefined,
  )

  return NextResponse.json(updated)
}

export const POST = withLogging(compose('instructor')(postHandler))

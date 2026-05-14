import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { sendFeedbackEmail } from '@/lib/server/email'
import { z } from 'zod'

function getQuestionId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('qa')
  return segments[idx + 1] ?? ''
}

const AnswerSchema = z.object({
  text: z.string().min(1, 'Answer text is required').max(5000),
})

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId, role, isSystemAdmin } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const questionId = getQuestionId(req)

  const question = await tx.qAQuestion.findFirst({
    where: { id: questionId, schoolId },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: { select: { title: true } },
              assignments: { where: { instructorId: userId }, select: { id: true } },
            },
          },
        },
      },
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  // Only instructors assigned to the containing module (or school_admin / system_admin) may answer
  if (!isSystemAdmin && role !== 'school_admin') {
    if (role !== 'instructor') {
      return NextResponse.json({ error: 'Instructors only' }, { status: 403 })
    }
    const isAssigned = question.lesson.module.assignments.length > 0
    if (!isAssigned) {
      return NextResponse.json(
        { error: 'You are not assigned to the module containing this lesson' },
        { status: 403 },
      )
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = AnswerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const updated = await tx.qAQuestion.update({
    where: { id: questionId },
    data: {
      answer: parsed.data.text,
      answeredById: userId,
      answeredAt: new Date(),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  // Fire-and-forget email to the student who asked
  sendFeedbackEmail(
    question.user.email,
    `${question.user.firstName} ${question.user.lastName}`,
    question.lesson.module.course.title,
    parsed.data.text,
  ).catch(() => {})

  return NextResponse.json({ ...updated, hasUpvoted: false })
}

export const POST = withLogging(withAuth(withTenant(postHandler)))

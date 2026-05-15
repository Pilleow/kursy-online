import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { z } from 'zod'

function getQuizId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('quizzes')
  return segments[idx + 1] ?? ''
}

const UpdateQuizSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  cooldownMinutes: z.number().int().min(0).optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
        options: z.array(z.string()),
        correctAnswer: z.string().min(1),
        position: z.number().int().min(0),
        points: z.number().int().positive().default(1),
      }),
    )
    .min(1)
    .optional(),
})

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, isSystemAdmin } = ctx
  const id = getQuizId(req)

  const quiz = await tx.quiz.findFirst({
    where: { id, schoolId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const isPrivileged = isSystemAdmin || role === 'school_admin' || role === 'instructor'

  const questions = quiz.questions.map((q) => {
    if (isPrivileged) return q
    // Strip correctAnswer so students cannot see it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctAnswer: _correctAnswer, ...safe } = q
    return safe
  })

  return NextResponse.json({ ...quiz, questions })
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const id = getQuizId(req)

  const quiz = await tx.quiz.findFirst({
    where: { id, schoolId },
    include: { lesson: { select: { moduleId: true } } },
  })
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  if (role === 'instructor') {
    const assignment = await tx.moduleAssignment.findUnique({
      where: {
        moduleId_instructorId: { moduleId: quiz.lesson.moduleId, instructorId: userId! },
      },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateQuizSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { questions, title, cooldownMinutes } = parsed.data

  if (questions) {
    await tx.quizQuestion.deleteMany({ where: { quizId: id } })
    await tx.quizQuestion.createMany({
      data: questions.map((q) => ({ ...q, quizId: id, schoolId })),
    })
  }

  const updated = await tx.quiz.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(cooldownMinutes !== undefined && { cooldownMinutes }),
    },
    include: { questions: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json(updated)
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const PATCH = withLogging(compose('instructor')(patchHandler))

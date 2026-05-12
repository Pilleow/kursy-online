import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { redis } from '@/lib/server/redis'
import { z } from 'zod'

function getQuizId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('quizzes')
  return segments[idx + 1] ?? ''
}

const SubmitAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    }),
  ),
})

type CompletionRequirements = {
  minimumQuizScore?: number
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const quizId = getQuizId(req)

  const cooldownKey = `quiz-cooldown:${userId}:${quizId}`
  const cooldownValue = await redis.get(cooldownKey)
  if (cooldownValue) {
    return NextResponse.json({ cooldownUntil: cooldownValue }, { status: 429 })
  }

  const quiz = await tx.quiz.findFirst({
    where: { id: quizId, schoolId },
    include: {
      questions: true,
      lesson: {
        include: {
          module: {
            include: {
              course: { select: { completionRequirements: true } },
            },
          },
        },
      },
    },
  })
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = SubmitAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { answers } = parsed.data
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]))

  const totalQuestions = quiz.questions.length
  if (totalQuestions === 0) {
    return NextResponse.json({ error: 'Quiz has no questions' }, { status: 422 })
  }

  let correctCount = 0
  for (const question of quiz.questions) {
    const submitted = answerMap.get(question.id)
    if (submitted !== undefined && submitted === question.correctAnswer) {
      correctCount++
    }
  }

  const score = Math.round((correctCount / totalQuestions) * 100)

  const requirements = quiz.lesson.module.course
    .completionRequirements as CompletionRequirements
  const minimumQuizScore = requirements?.minimumQuizScore
  const passed = minimumQuizScore != null ? score >= minimumQuizScore : score === 100

  const answersRecord = Object.fromEntries(answerMap)

  const attempt = await tx.quizAttempt.create({
    data: {
      quizId,
      userId,
      schoolId,
      answers: answersRecord,
      score,
      passed,
      completedAt: new Date(),
    },
  })

  let cooldownUntil: string | undefined
  if (!passed && quiz.cooldownMinutes > 0) {
    const ttlSeconds = quiz.cooldownMinutes * 60
    cooldownUntil = new Date(Date.now() + ttlSeconds * 1000).toISOString()
    await redis.set(cooldownKey, cooldownUntil, 'EX', ttlSeconds)
  }

  return NextResponse.json(
    { score, passed, attemptId: attempt.id, ...(cooldownUntil && { cooldownUntil }) },
    { status: 201 },
  )
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const quizId = getQuizId(req)

  const quiz = await tx.quiz.findFirst({ where: { id: quizId, schoolId } })
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const attempts = await tx.quizAttempt.findMany({
    where: { quizId, userId, schoolId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(attempts)
}

export const POST = withLogging(withAuth(withTenant(postHandler)))
export const GET = withLogging(withAuth(withTenant(getHandler)))

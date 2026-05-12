import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { redis } from '@/lib/server/redis'

function getQuizId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('quizzes')
  return segments[idx + 1] ?? ''
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

  const attempt = await tx.quizAttempt.findFirst({
    where: { quizId, userId, schoolId },
    orderBy: { createdAt: 'desc' },
  })

  if (!attempt) {
    return NextResponse.json({ error: 'No attempts found' }, { status: 404 })
  }

  const cooldownKey = `quiz-cooldown:${userId}:${quizId}`
  const cooldownUntil = await redis.get(cooldownKey)

  return NextResponse.json({
    ...attempt,
    ...(cooldownUntil && { cooldownUntil }),
  })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

function getQuestionId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('qa')
  return segments[idx + 1] ?? ''
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const questionId = getQuestionId(req)

  const question = await tx.qAQuestion.findFirst({ where: { id: questionId, schoolId } })
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const existing = await tx.upvote.findUnique({
    where: { userId_questionId: { userId, questionId } },
  })

  let hasUpvoted: boolean
  let upvotes: number

  if (existing) {
    // Remove upvote
    await tx.upvote.delete({ where: { id: existing.id } })
    const updated = await tx.qAQuestion.update({
      where: { id: questionId },
      data: { upvotes: { decrement: 1 } },
      select: { upvotes: true },
    })
    hasUpvoted = false
    upvotes = Math.max(0, updated.upvotes)
  } else {
    // Add upvote
    await tx.upvote.create({ data: { userId, questionId } })
    const updated = await tx.qAQuestion.update({
      where: { id: questionId },
      data: { upvotes: { increment: 1 } },
      select: { upvotes: true },
    })
    hasUpvoted = true
    upvotes = updated.upvotes
  }

  return NextResponse.json({ upvotes, hasUpvoted })
}

export const POST = withLogging(withAuth(withTenant(postHandler)))

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { z } from 'zod'

function getLessonId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('lessons')
  return segments[idx + 1] ?? ''
}

const PostQuestionSchema = z.object({
  body: z.string().min(1, 'Question text is required').max(2000),
})

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx
  const lessonId = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id: lessonId, schoolId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const sort = req.nextUrl.searchParams.get('sort') ?? 'newest'

  const questions = await tx.qAQuestion.findMany({
    where: { lessonId, schoolId },
    orderBy:
      sort === 'popular'
        ? [{ upvotes: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }],
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      upvoteRecords: userId ? { where: { userId }, select: { id: true } } : false,
    },
  })

  const result = questions.map((q) => ({
    ...q,
    hasUpvoted: userId ? q.upvoteRecords.length > 0 : false,
    upvoteRecords: undefined,
  }))

  return NextResponse.json(result)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId, role } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (role !== 'student' && role !== 'instructor' && role !== 'school_admin') {
    return NextResponse.json({ error: 'Enrollment required to ask questions' }, { status: 403 })
  }

  const lessonId = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id: lessonId, schoolId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = PostQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const question = await tx.qAQuestion.create({
    data: {
      lessonId,
      userId,
      schoolId,
      body: parsed.data.body,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json({ ...question, hasUpvoted: false }, { status: 201 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(withAuth(withTenant(postHandler)))

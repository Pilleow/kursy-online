import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { z } from 'zod'

function getHomeworkId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('homeworks')
  return segments[idx + 1] ?? ''
}

const SubmissionSchema = z.object({
  answers: z.record(z.string(), z.string()),
})

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId, role, isSystemAdmin } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const homeworkId = getHomeworkId(req)

  const homework = await tx.homework.findFirst({ where: { id: homeworkId, schoolId } })
  if (!homework) {
    return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
  }

  const isPrivileged = isSystemAdmin || role === 'school_admin' || role === 'instructor'

  if (isPrivileged) {
    const submissions = await tx.homeworkSubmission.findMany({
      where: { homeworkId, schoolId },
      orderBy: { submittedAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })
    return NextResponse.json(submissions)
  }

  const submission = await tx.homeworkSubmission.findUnique({
    where: { homeworkId_userId: { homeworkId, userId } },
  })

  return NextResponse.json(submission ?? null)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const homeworkId = getHomeworkId(req)

  const homework = await tx.homework.findFirst({ where: { id: homeworkId, schoolId } })
  if (!homework) {
    return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
  }

  const existing = await tx.homeworkSubmission.findUnique({
    where: { homeworkId_userId: { homeworkId, userId } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
  }

  const body = await req.json().catch(() => null)
  const parsed = SubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const submission = await tx.homeworkSubmission.create({
    data: {
      homeworkId,
      userId,
      schoolId,
      answers: parsed.data.answers,
      submittedAt: new Date(),
    },
  })

  return NextResponse.json(submission, { status: 201 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(withAuth(withTenant(postHandler)))

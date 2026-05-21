import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { z } from 'zod'

function getHomeworkId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('homeworks')
  return segments[idx + 1] ?? ''
}

const UpdateHomeworkSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional().nullable(),
  archive: z.boolean().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        type: z.enum(['text', 'file_upload', 'single_choice', 'multiple_choice']),
        options: z.array(z.string()).optional(),
        position: z.number().int().min(0),
        required: z.boolean().default(true),
      }),
    )
    .min(1)
    .optional(),
})

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getHomeworkId(req)

  const homework = await tx.homework.findFirst({
    where: { id, schoolId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!homework) {
    return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
  }

  return NextResponse.json(homework)
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const id = getHomeworkId(req)

  const homework = await tx.homework.findFirst({
    where: { id, schoolId },
    include: { lesson: { select: { moduleId: true } } },
  })
  if (!homework) {
    return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
  }

  if (role === 'instructor') {
    const assignment = await tx.moduleAssignment.findUnique({
      where: {
        moduleId_instructorId: { moduleId: homework.lesson.moduleId, instructorId: userId! },
      },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateHomeworkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { questions, title, description, dueAt, archive } = parsed.data

  if (questions) {
    await tx.homeworkQuestion.deleteMany({ where: { homeworkId: id } })
    await tx.homeworkQuestion.createMany({
      data: questions.map((q) => ({
        homeworkId: id,
        schoolId,
        text: q.text,
        type: q.type,
        options: q.options ?? [],
        position: q.position,
        required: q.required,
      })),
    })
  }

  const updated = await tx.homework.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
      ...(archive === true && { archivedAt: new Date() }),
      ...(archive === false && { archivedAt: null }),
    },
    include: { questions: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json(updated)
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const PATCH = withLogging(compose('instructor')(patchHandler))

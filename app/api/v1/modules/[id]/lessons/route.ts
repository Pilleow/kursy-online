import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { CreateLessonSchema } from '@/lib/schemas/lesson'

function getModuleId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('modules')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const moduleId = getModuleId(req)

  const module = await tx.module.findFirst({ where: { id: moduleId, schoolId } })
  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const lessons = await tx.lesson.findMany({
    where: { moduleId, schoolId },
    orderBy: { position: 'asc' },
  })

  return NextResponse.json(lessons)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const moduleId = getModuleId(req)

  const module = await tx.module.findFirst({ where: { id: moduleId, schoolId } })
  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  if (role === 'instructor') {
    const assignment = await tx.moduleAssignment.findUnique({
      where: { moduleId_instructorId: { moduleId, instructorId: userId! } },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateLessonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const max = await tx.lesson.aggregate({
    where: { moduleId, schoolId },
    _max: { position: true },
  })
  const position = (max._max.position ?? 0) + 1

  const lesson = await tx.lesson.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      moduleId,
      schoolId,
      position,
    },
  })

  if (parsed.data.type === 'quiz') {
    await tx.quiz.create({
      data: {
        lessonId: lesson.id,
        schoolId,
        title: parsed.data.title,
      },
    })
  } else if (parsed.data.type === 'homework') {
    await tx.homework.create({
      data: {
        lessonId: lesson.id,
        schoolId,
        title: parsed.data.title,
      },
    })
  }

  return NextResponse.json(lesson, { status: 201 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(compose('instructor')(postHandler))

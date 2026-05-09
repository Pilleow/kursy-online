import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { CreateModuleSchema } from '@/lib/schemas/module'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)

  const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const modules = await tx.module.findMany({
    where: { courseId, schoolId },
    orderBy: { position: 'asc' },
    include: { _count: { select: { lessons: true } } },
  })

  return NextResponse.json(modules)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)

  const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateModuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const max = await tx.module.aggregate({
    where: { courseId, schoolId },
    _max: { position: true },
  })
  const position = (max._max.position ?? 0) + 1

  const module = await tx.module.create({
    data: {
      title: parsed.data.title,
      courseId,
      schoolId,
      position,
    },
  })

  return NextResponse.json(module, { status: 201 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(compose('school_admin')(postHandler))

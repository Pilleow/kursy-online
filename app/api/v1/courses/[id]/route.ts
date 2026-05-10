import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { UpdateCourseSchema } from '@/lib/schemas/course'
import { redis } from '@/lib/server/redis'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCourseId(req)

  const course = await tx.course.findFirst({
    where: { id, schoolId },
    include: { modules: { orderBy: { position: 'asc' } } },
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  return NextResponse.json(course)
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCourseId(req)

  const existing = await tx.course.findFirst({ where: { id, schoolId } })
  if (!existing) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { title, description, price, status } = parsed.data

  const course = await tx.course.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { priceUsd: price }),
      ...(status !== undefined && { status }),
    },
  })

  await redis.del(`courses:${schoolId}`)

  return NextResponse.json(course)
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCourseId(req)

  const existing = await tx.course.findFirst({ where: { id, schoolId } })
  if (!existing) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  await tx.course.update({
    where: { id },
    data: { status: 'archived' },
  })

  await redis.del(`courses:${schoolId}`)

  return new NextResponse(null, { status: 204 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const PATCH = withLogging(compose('school_admin')(patchHandler))
export const DELETE = withLogging(compose('school_admin')(deleteHandler))

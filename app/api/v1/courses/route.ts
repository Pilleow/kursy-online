import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { CreateCourseSchema } from '@/lib/schemas/course'
import { redis } from '@/lib/server/redis'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const status = searchParams.get('status') ?? null

  const cacheKey = `courses:${schoolId}`
  const cached = await redis.get(cacheKey)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allCourses: any[]
  if (cached) {
    allCourses = JSON.parse(cached)
  } else {
    allCourses = await tx.course.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    })
    await redis.setex(cacheKey, 300, JSON.stringify(allCourses))
  }

  const filtered = status ? allCourses.filter((c) => c.status === status) : allCourses
  const total = filtered.length
  const data = filtered.slice((page - 1) * limit, page * limit)

  return NextResponse.json({ data, meta: { page, limit, total } })
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const body = await req.json().catch(() => null)
  const parsed = CreateCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { title, description, price } = parsed.data

  let slug = slugify(title) || 'course'
  const existing = await tx.course.findUnique({
    where: { schoolId_slug: { schoolId, slug } },
  })
  if (existing) {
    slug = `${slug}-${Date.now()}`
  }

  const course = await tx.course.create({
    data: {
      schoolId,
      title,
      slug,
      description,
      priceUsd: price ?? null,
    },
  })

  await redis.del(`courses:${schoolId}`)

  return NextResponse.json(course, { status: 201 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(compose('school_admin')(postHandler))

import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { CouponSchema } from '@/lib/schemas/school'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const coupons = await tx.coupon.findMany({
    where: { schoolId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(coupons)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  const parsed = CouponSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { code, discountPct, courseId, maxUses, expiresAt } = parsed.data

  const existing = await tx.coupon.findUnique({
    where: { schoolId_code: { schoolId, code } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
  }

  if (courseId) {
    const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
  }

  const coupon = await tx.coupon.create({
    data: {
      schoolId,
      code,
      discountPct,
      courseId: courseId ?? null,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
  })

  return NextResponse.json(coupon, { status: 201 })
}

export const GET = withLogging(compose('school_admin')(getHandler))
export const POST = withLogging(compose('school_admin')(postHandler))

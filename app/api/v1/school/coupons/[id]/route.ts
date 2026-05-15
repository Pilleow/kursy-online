import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { CouponSchema } from '@/lib/schemas/school'

function getCouponId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('coupons')
  return segments[idx + 1] ?? ''
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCouponId(req)

  const coupon = await tx.coupon.findFirst({ where: { id, schoolId } })
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CouponSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { code, discountPct, courseId, maxUses, expiresAt } = parsed.data

  if (code && code !== coupon.code) {
    const existing = await tx.coupon.findUnique({
      where: { schoolId_code: { schoolId, code } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }
  }

  if (courseId) {
    const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
  }

  const updated = await tx.coupon.update({
    where: { id },
    data: {
      ...(code !== undefined && { code }),
      ...(discountPct !== undefined && { discountPct }),
      ...(courseId !== undefined && { courseId: courseId ?? null }),
      ...(maxUses !== undefined && { maxUses: maxUses ?? null }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
  })

  return NextResponse.json(updated)
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getCouponId(req)

  const coupon = await tx.coupon.findFirst({ where: { id, schoolId } })
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  }

  await tx.coupon.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const PATCH = withLogging(compose('school_admin')(patchHandler))
export const DELETE = withLogging(compose('school_admin')(deleteHandler))

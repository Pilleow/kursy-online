import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { CouponSchema } from '@/lib/schemas/school'

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, isSystemAdmin } = ctx
  const code = req.nextUrl.searchParams.get('code')

  if (code) {
    // Coupon validation for any authenticated user (used by the checkout flow).
    // Returns only the discount info — never the full coupon list.
    const now = new Date()
    const coupon = await tx.coupon.findFirst({
      where: {
        schoolId,
        code,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { code: true, discountPct: true, courseId: true, maxUses: true, usedCount: true },
    })

    if (!coupon || (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 })
    }

    return NextResponse.json({
      code: coupon.code,
      discountPct: coupon.discountPct,
      courseId: coupon.courseId,
    })
  }

  // Full coupon list — school_admin only
  if (!isSystemAdmin && role !== 'school_admin') {
    return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
  }

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

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(compose('school_admin')(postHandler))

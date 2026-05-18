import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { CreateEnrollmentSchema } from '@/lib/schemas/enrollment'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const enrollments = await tx.enrollment.findMany({
    where: { userId, schoolId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          status: true,
          priceUsd: true,
          accessDurationDays: true,
          modules: {
            take: 1,
            orderBy: { position: 'asc' },
            select: {
              assignments: {
                take: 1,
                select: {
                  instructor: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      },
      coupon: {
        select: { code: true, discountPct: true },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  const shaped = enrollments.map(({ course, ...rest }) => {
    const firstAssignment = course.modules?.[0]?.assignments?.[0]
    const instructorName = firstAssignment
      ? `${firstAssignment.instructor.firstName} ${firstAssignment.instructor.lastName}`
      : null
    return {
      ...rest,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        status: course.status,
        priceUsd: course.priceUsd,
        accessDurationDays: course.accessDurationDays,
        instructorName,
      },
    }
  })

  return NextResponse.json(shaped)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateEnrollmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { courseId, couponCode } = parsed.data

  const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (course.status !== 'published') {
    return NextResponse.json({ error: 'Course is not published' }, { status: 422 })
  }

  const existing = await tx.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
  }

  let coupon: { id: string; discountPct: number } | null = null

  if (couponCode) {
    const now = new Date()
    const found = await tx.coupon.findFirst({
      where: {
        schoolId,
        code: couponCode,
        OR: [
          { courseId, expiresAt: null },
          { courseId, expiresAt: { gt: now } },
          { courseId: null, expiresAt: null },
          { courseId: null, expiresAt: { gt: now } },
        ],
      },
      select: { id: true, discountPct: true, maxUses: true, usedCount: true },
    })

    // Validate use count in application code after fetching
    if (!found || (found.maxUses !== null && found.usedCount >= found.maxUses)) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 400 })
    }

    coupon = { id: found.id, discountPct: found.discountPct }
  }

  const basePrice = course.priceUsd ? Number(course.priceUsd) : 0
  const finalPrice = coupon ? basePrice * (1 - coupon.discountPct / 100) : basePrice

  // For paid courses (finalPrice > 0) this endpoint assumes payment has already
  // been confirmed (e.g. via Stripe webhook). Stripe integration point: before
  // calling this route, your checkout flow should verify the PaymentIntent status.

  const enrolledAt = new Date()
  const expiresAt =
    course.accessDurationDays != null
      ? new Date(enrolledAt.getTime() + course.accessDurationDays * 24 * 60 * 60 * 1000)
      : null

  // withTenant already opened a db.$transaction — reuse tx for atomic enrollment + coupon update
  const enrollment = await tx.enrollment.create({
    data: {
      courseId,
      userId,
      schoolId,
      couponId: coupon?.id ?? null,
      pricePaid: finalPrice,
      enrolledAt,
      expiresAt,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          priceUsd: true,
          accessDurationDays: true,
        },
      },
      coupon: { select: { code: true, discountPct: true } },
    },
  })

  if (coupon) {
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    })
  }

  return NextResponse.json(enrollment, { status: 201 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const POST = withLogging(withAuth(withTenant(postHandler)))

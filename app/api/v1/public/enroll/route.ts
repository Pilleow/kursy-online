import 'server-only'

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

const PublicEnrollSchema = z.object({
  email: z.string().email(),
  courseId: z.string().min(1),
  externalPaymentRef: z.string().optional(),
})

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  const parsed = PublicEnrollSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, courseId } = parsed.data

  const course = await tx.course.findFirst({
    where: { id: courseId, schoolId, status: 'published' },
  })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Find existing user or create one — auto-created accounts get a random
  // password that can be reset via the forgot-password flow.
  let user = await tx.user.findUnique({ where: { email } })
  if (!user) {
    const rawPassword = crypto.randomBytes(32).toString('hex')
    const passwordHash = await bcrypt.hash(rawPassword, 10)
    user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName: email.split('@')[0],
        lastName: '',
      },
    })
  }

  const existing = await tx.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
  }

  const enrolledAt = new Date()
  const expiresAt =
    course.accessDurationDays != null
      ? new Date(enrolledAt.getTime() + course.accessDurationDays * 24 * 60 * 60 * 1000)
      : null

  const enrollment = await tx.enrollment.create({
    data: {
      courseId,
      userId: user.id,
      schoolId,
      pricePaid: course.priceUsd ?? 0,
      enrolledAt,
      expiresAt,
    },
    select: {
      id: true,
      courseId: true,
      userId: true,
      enrolledAt: true,
      expiresAt: true,
      pricePaid: true,
    },
  })

  // Ensure the user has a student membership in this school
  await tx.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId, userId: user.id } },
    create: { schoolId, userId: user.id, role: 'student' },
    update: {},
  })

  return NextResponse.json(enrollment, { status: 201 })
}

export const POST = withLogging(withAuth(withTenant(postHandler)))

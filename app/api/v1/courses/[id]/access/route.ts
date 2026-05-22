import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

function getCourseId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return segments[idx + 1] ?? ''
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const courseId = getCourseId(req)

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const course = await tx.course.findFirst({ where: { id: courseId, schoolId } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
  if (course.status === 'archived') {
    return NextResponse.json({ error: 'This course is archived and no longer accepting new enrollments' }, { status: 422 })
  }

  const user = await tx.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
  }

  // Ensure the user is a member of this school (auto-create as student if not)
  const membership = await tx.schoolMembership.findUnique({
    where: { schoolId_userId: { schoolId, userId: user.id } },
  })
  if (!membership) {
    await tx.schoolMembership.create({
      data: { schoolId, userId: user.id, role: 'student' },
    })
  }

  const existing = await tx.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Student is already enrolled in this course' }, { status: 409 })
  }

  const enrolledAt = new Date()
  const expiresAt =
    course.accessDurationDays != null
      ? new Date(enrolledAt.getTime() + course.accessDurationDays * 24 * 60 * 60 * 1000)
      : null

  const enrollment = await tx.enrollment.create({
    data: { courseId, userId: user.id, schoolId, pricePaid: 0, enrolledAt, expiresAt },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json(enrollment, { status: 201 })
}

export const POST = withLogging(compose('school_admin')(postHandler))

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { compose } from '@/lib/server/middleware/withRole'
import { UpdateLessonSchema } from '@/lib/schemas/lesson'

function getLessonId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('lessons')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id, schoolId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  return NextResponse.json(lesson)
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const id = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id, schoolId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  if (role === 'instructor') {
    const assignment = await tx.moduleAssignment.findUnique({
      where: {
        moduleId_instructorId: { moduleId: lesson.moduleId, instructorId: userId! },
      },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateLessonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (!parsed.data.title && !parsed.data.status && !parsed.data.moduleId) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // If moving to a different module, verify the target module exists in this tenant.
  if (parsed.data.moduleId && parsed.data.moduleId !== lesson.moduleId) {
    const targetModule = await tx.module.findFirst({
      where: { id: parsed.data.moduleId, schoolId },
    })
    if (!targetModule) {
      return NextResponse.json({ error: 'Target module not found' }, { status: 404 })
    }

    // Instructor must also be assigned to the target module.
    if (role === 'instructor') {
      const targetAssignment = await tx.moduleAssignment.findUnique({
        where: {
          moduleId_instructorId: { moduleId: parsed.data.moduleId, instructorId: userId! },
        },
      })
      if (!targetAssignment) {
        return NextResponse.json(
          { error: 'Not assigned to target module' },
          { status: 403 },
        )
      }
    }
  }

  const updated = await tx.lesson.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.moduleId !== undefined && { moduleId: parsed.data.moduleId }),
    },
  })

  return NextResponse.json(updated)
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getLessonId(req)

  const lesson = await tx.lesson.findFirst({ where: { id, schoolId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  await tx.lesson.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))
export const PATCH = withLogging(compose('instructor')(patchHandler))
export const DELETE = withLogging(compose('school_admin')(deleteHandler))

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { UpdateModuleSchema } from '@/lib/schemas/module'

function getModuleId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('modules')
  return segments[idx + 1] ?? ''
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, role, userId } = ctx
  const id = getModuleId(req)

  const module = await tx.module.findFirst({ where: { id, schoolId } })
  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  // Instructors may only edit modules they are explicitly assigned to.
  if (role === 'instructor') {
    const assignment = await tx.moduleAssignment.findUnique({
      where: { moduleId_instructorId: { moduleId: id, instructorId: userId! } },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Requires role 'school_admin' or higher" }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateModuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (!parsed.data.title && !parsed.data.status) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updated = await tx.module.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    },
  })

  return NextResponse.json(updated)
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getModuleId(req)

  const module = await tx.module.findFirst({ where: { id, schoolId } })
  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  // Cascade to lessons and ModuleAssignment records is handled by the DB schema.
  await tx.module.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

// Instructors who are assigned to the module may PATCH; school_admin may always PATCH or DELETE.
export const PATCH = withLogging(compose('instructor')(patchHandler))
export const DELETE = withLogging(compose('school_admin')(deleteHandler))

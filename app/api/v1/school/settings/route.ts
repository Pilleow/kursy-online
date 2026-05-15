import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { SchoolSettingsSchema } from '@/lib/schemas/school'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const school = await tx.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, slug: true, settings: true, isActive: true, updatedAt: true },
  })
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  return NextResponse.json(school)
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const school = await tx.school.findUnique({ where: { id: schoolId } })
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = SchoolSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const currentSettings = (school.settings as Record<string, unknown>) ?? {}
  const merged = { ...currentSettings, ...parsed.data }

  const updated = await tx.school.update({
    where: { id: schoolId },
    data: { settings: merged },
    select: { id: true, name: true, slug: true, settings: true, isActive: true, updatedAt: true },
  })

  return NextResponse.json(updated)
}

export const GET = withLogging(compose('school_admin')(getHandler))
export const PATCH = withLogging(compose('school_admin')(patchHandler))

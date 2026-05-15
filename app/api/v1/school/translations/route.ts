import 'server-only'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const PatchTranslationsSchema = z.array(
  z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  }),
)

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const school = await tx.school.findUnique({
    where: { id: schoolId },
    select: { settings: true },
  })
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  const settings = (school.settings as Record<string, unknown>) ?? {}
  const translations = (settings.translations as Record<string, string>) ?? {}

  return NextResponse.json({ translations })
}

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const school = await tx.school.findUnique({
    where: { id: schoolId },
    select: { settings: true },
  })
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = PatchTranslationsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const currentSettings = (school.settings as Record<string, unknown>) ?? {}
  const currentTranslations = (currentSettings.translations as Record<string, string>) ?? {}

  const incoming = Object.fromEntries(parsed.data.map(({ key, value }) => [key, value]))
  const merged = { ...currentTranslations, ...incoming }

  await tx.school.update({
    where: { id: schoolId },
    data: { settings: { ...currentSettings, translations: merged } },
  })

  return NextResponse.json({ translations: merged })
}

export const GET = withLogging(compose('school_admin')(getHandler))
export const PATCH = withLogging(compose('school_admin')(patchHandler))

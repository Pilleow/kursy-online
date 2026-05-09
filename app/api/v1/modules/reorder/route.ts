import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { ReorderModulesSchema } from '@/lib/schemas/module'

const patchHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  const parsed = ReorderModulesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { moduleIds } = parsed.data

  // Verify all provided modules belong to the current tenant.
  const modules = await tx.module.findMany({
    where: { id: { in: moduleIds }, schoolId },
    select: { id: true, position: true },
  })

  if (modules.length !== moduleIds.length) {
    return NextResponse.json({ error: 'One or more modules not found' }, { status: 404 })
  }

  // Slot assignment: collect positions currently held by the provided modules,
  // sort them ascending, then assign the i-th slot to moduleIds[i].
  // Modules not in the list keep their original positions unchanged.
  const slots = modules.map((m) => m.position).sort((a, b) => a - b)

  await Promise.all(
    moduleIds.map((id, i) => tx.module.update({ where: { id }, data: { position: slots[i] } })),
  )

  return new NextResponse(null, { status: 204 })
}

export const PATCH = withLogging(compose('school_admin')(patchHandler))

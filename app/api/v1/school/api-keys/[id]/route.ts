import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

function getApiKeyId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('api-keys')
  return segments[idx + 1] ?? ''
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const id = getApiKeyId(req)

  const apiKey = await tx.apiKey.findFirst({ where: { id, schoolId } })
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }

  await tx.apiKey.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const DELETE = withLogging(compose('school_admin')(deleteHandler))

import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const certificates = await tx.certificate.findMany({
    where: { userId, schoolId },
    include: {
      course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
    },
    orderBy: { issuedAt: 'desc' },
  })

  return NextResponse.json(certificates)
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

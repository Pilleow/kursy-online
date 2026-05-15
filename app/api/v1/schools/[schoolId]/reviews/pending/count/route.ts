import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const count = await tx.contentReview.count({
    where: { schoolId, status: 'pending' },
  })

  return NextResponse.json({ count })
}

export const GET = withLogging(compose('school_admin')(getHandler))

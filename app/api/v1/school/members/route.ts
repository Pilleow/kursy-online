import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const members = await tx.schoolMembership.findMany({
    where: { schoolId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(members)
}

export const GET = withLogging(compose('school_admin')(getHandler))

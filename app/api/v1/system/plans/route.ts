import 'server-only'

import { NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { withSystemAdmin } from '@/lib/server/middleware/withSystemAdmin'
import { withLogging } from '@/lib/server/middleware/withLogging'

const getHandler = withSystemAdmin(async () => {
  const plans = await db.plan.findMany({
    include: { _count: { select: { schools: true } } },
    orderBy: { priceUsd: 'asc' },
  })

  return NextResponse.json(plans)
})

export const GET = withLogging(getHandler)

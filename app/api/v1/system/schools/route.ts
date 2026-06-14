import 'server-only'

import { NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { withSystemAdmin } from '@/lib/server/middleware/withSystemAdmin'
import { withLogging } from '@/lib/server/middleware/withLogging'

const getHandler = withSystemAdmin(async () => {
  const schools = await db.school.findMany({
    include: {
      plan: true,
      _count: { select: { courses: true, memberships: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(schools)
})

export const GET = withLogging(getHandler)

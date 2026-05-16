import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

  const [data, total] = await Promise.all([
    tx.course.findMany({
      where: { schoolId, status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        priceUsd: true,
        accessDurationDays: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    tx.course.count({ where: { schoolId, status: 'published' } }),
  ])

  return NextResponse.json({ data, meta: { page, limit, total } })
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

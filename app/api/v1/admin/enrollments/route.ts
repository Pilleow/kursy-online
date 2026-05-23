import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const url = req.nextUrl

  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '25')))
  const courseId = url.searchParams.get('courseId') ?? undefined
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined

  const enrolledAt =
    from || to
      ? {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        }
      : undefined

  const where = {
    schoolId,
    ...(courseId ? { courseId } : {}),
    ...(enrolledAt ? { enrolledAt } : {}),
  }

  const [total, rows] = await Promise.all([
    tx.enrollment.count({ where }),
    tx.enrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true } },
        coupon: { select: { code: true, discountPct: true } },
      },
    }),
  ])

  return NextResponse.json({ data: rows, meta: { page, limit, total } })
}

export const GET = withLogging(compose('school_admin')(getHandler))

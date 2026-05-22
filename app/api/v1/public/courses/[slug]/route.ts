import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'

function getSlug(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('courses')
  return decodeURIComponent(segments[idx + 1] ?? '')
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx
  const slug = getSlug(req)

  const course = await tx.course.findFirst({
    where: { schoolId, slug, status: { in: ['published', 'archived'] } },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceUsd: true,
      accessDurationDays: true,
      completionRequirements: true,
      createdAt: true,
      updatedAt: true,
      modules: {
        where: { status: 'published' },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            where: { status: 'published' },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              position: true,
              type: true,
              durationS: true,
              // blocks intentionally excluded — not exposed via public API
            },
          },
        },
      },
    },
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  return NextResponse.json(course)
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

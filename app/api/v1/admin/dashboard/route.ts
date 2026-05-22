import 'server-only'

import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

export type ActivityEventType = 'enrollment' | 'review_submitted' | 'review_approved' | 'review_rejected'

export type ActivityEvent = {
  id: string
  type: ActivityEventType
  actorName: string
  description: string
  createdAt: string
}

export type DashboardSummary = {
  activeCourses: number
  totalStudents: number
  pendingReviews: number
  thisMonthEnrollments: number
  recentActivity: ActivityEvent[]
}

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [activeCourses, pendingReviews, thisMonthEnrollments, studentIds, recentEnrollments, recentReviews] =
    await Promise.all([
      tx.course.count({ where: { schoolId, status: 'published' } }),

      tx.contentReview.count({ where: { schoolId, status: 'pending' } }),

      tx.enrollment.count({
        where: { schoolId, createdAt: { gte: monthStart } },
      }),

      tx.enrollment.findMany({
        where: { schoolId },
        select: { userId: true },
        distinct: ['userId'],
      }),

      tx.enrollment.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
          course: { select: { title: true } },
        },
      }),

      tx.contentReview.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          instructor: { select: { firstName: true, lastName: true } },
          lesson: { select: { title: true } },
        },
      }),
    ])

  const enrollmentEvents: ActivityEvent[] = recentEnrollments.map((e) => ({
    id: `enrollment-${e.id}`,
    type: 'enrollment',
    actorName: `${e.user.firstName} ${e.user.lastName}`,
    description: `enrolled in "${e.course.title}"`,
    createdAt: e.createdAt.toISOString(),
  }))

  const reviewEvents: ActivityEvent[] = recentReviews.map((r) => {
    const actorName = `${r.instructor.firstName} ${r.instructor.lastName}`
    if (r.status === 'pending') {
      return {
        id: `review-${r.id}`,
        type: 'review_submitted',
        actorName,
        description: `submitted "${r.lesson.title}" for review`,
        createdAt: r.createdAt.toISOString(),
      }
    }
    if (r.status === 'approved') {
      return {
        id: `review-${r.id}`,
        type: 'review_approved',
        actorName,
        description: `lesson "${r.lesson.title}" was approved`,
        createdAt: (r.reviewedAt ?? r.createdAt).toISOString(),
      }
    }
    return {
      id: `review-${r.id}`,
      type: 'review_rejected',
      actorName,
      description: `lesson "${r.lesson.title}" was rejected`,
      createdAt: (r.reviewedAt ?? r.createdAt).toISOString(),
    }
  })

  const recentActivity = [...enrollmentEvents, ...reviewEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  const summary: DashboardSummary = {
    activeCourses,
    totalStudents: studentIds.length,
    pendingReviews,
    thisMonthEnrollments,
    recentActivity,
  }

  return NextResponse.json(summary)
}

export const GET = withLogging(compose('school_admin')(getHandler))

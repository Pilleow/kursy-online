'use client'

import Link from 'next/link'
import {
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  UserPlus,
  FileSearch,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAdminDashboard } from '@/lib/hooks/useAdminStats'
import { useAuthStore } from '@/lib/store/authStore'
import type { ActivityEvent } from '@/app/api/v1/admin/dashboard/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── StatsCards ───────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  value: number | null
  icon: React.ElementType
  href?: string
  badge?: number | null
  loading: boolean
  accentClass?: string
}

function StatCard({ label, value, icon: Icon, href, badge, loading, accentClass }: StatCardProps) {
  const inner = (
    <Card className={`relative overflow-hidden transition-shadow ${href ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${accentClass ?? 'bg-gray-100 dark:bg-gray-800'}`}>
          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {value ?? '—'}
            </span>
            {badge != null && badge > 0 && (
              <Badge className="mb-1 bg-orange-500 text-white hover:bg-orange-600 text-[10px] px-1.5 py-0.5">
                {badge > 99 ? '99+' : badge} pending
              </Badge>
            )}
          </div>
        )}
        {href && !loading && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}

function StatsCards({ schoolId }: { schoolId: string | null }) {
  const { data, isLoading } = useAdminDashboard(schoolId)

  const cards = [
    {
      label: 'Active Courses',
      value: data?.activeCourses ?? null,
      icon: BookOpen,
      href: '/admin/courses',
      accentClass: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: 'Total Students',
      value: data?.totalStudents ?? null,
      icon: GraduationCap,
      href: '/admin/students',
      accentClass: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: 'Pending Reviews',
      value: data?.pendingReviews ?? null,
      icon: ClipboardCheck,
      href: '/admin/courses',
      badge: data?.pendingReviews ?? null,
      accentClass: 'bg-orange-50 dark:bg-orange-900/30',
    },
    {
      label: 'This Month Enrollments',
      value: data?.thisMonthEnrollments ?? null,
      icon: TrendingUp,
      href: '/admin/enrollments',
      accentClass: 'bg-purple-50 dark:bg-purple-900/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} loading={isLoading} />
      ))}
    </div>
  )
}

// ─── Activity icon ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  if (type === 'enrollment') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
        <UserPlus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      </div>
    )
  }
  if (type === 'review_submitted') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
        <FileSearch className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
      </div>
    )
  }
  if (type === 'review_approved') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
        <CheckCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      </div>
    )
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
      <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
    </div>
  )
}

// ─── RecentActivityFeed ────────────────────────────────────────────────────────

function ActivityRow({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <ActivityIcon type={event.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[9px] font-semibold text-gray-600 dark:text-gray-300">
            {initials(event.actorName)}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
            {event.actorName}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{event.description}</span>
        </div>
      </div>
      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-600">{timeAgo(event.createdAt)}</span>
    </div>
  )
}

function RecentActivityFeed({ schoolId }: { schoolId: string | null }) {
  const { data, isLoading } = useAdminDashboard(schoolId)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Recent Activity
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-600">Last 20 events</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {isLoading && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 px-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-64" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!data?.recentActivity || data.recentActivity.length === 0) && (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
            No recent activity yet.
          </div>
        )}

        {!isLoading && data?.recentActivity && data.recentActivity.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 px-5">
            {data.recentActivity.map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const schoolId = useAuthStore((s) => s.schoolId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your school&apos;s activity. Pending Reviews links directly to the review queue.
        </p>
      </div>

      <StatsCards schoolId={schoolId} />

      <RecentActivityFeed schoolId={schoolId} />
    </div>
  )
}

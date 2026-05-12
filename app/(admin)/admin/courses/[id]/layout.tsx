'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { PendingReviewsBadge } from '@/components/layout/PendingReviewsBadge'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils'

function CourseTabNav({ courseId, schoolId }: { courseId: string; schoolId: string | null }) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Curriculum', href: `/admin/courses/${courseId}` },
    { label: 'Students', href: `/admin/courses/${courseId}/students` },
    {
      label: 'Reviews',
      href: `/admin/courses/${courseId}/reviews`,
      badge: <PendingReviewsBadge schoolId={schoolId} />,
    },
    { label: 'Settings', href: `/admin/courses/${courseId}/settings` },
  ]

  return (
    <nav className="flex gap-0.5 border-b border-gray-100 dark:border-gray-800 mb-6 -mt-2">
      {tabs.map((tab) => {
        const isActive =
          tab.href === `/admin/courses/${courseId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 text-sm transition-colors',
              isActive
                ? 'text-gray-900 dark:text-gray-50 font-medium after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-gray-900 dark:after:bg-gray-50'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100',
            )}
          >
            {tab.label}
            {tab.badge}
          </Link>
        )
      })}
    </nav>
  )
}

export default function CourseLayout({ children }: { children: ReactNode }) {
  const { id: courseId } = useParams<{ id: string }>()
  const schoolId = useAuthStore((s) => s.schoolId)

  return (
    <div>
      <CourseTabNav courseId={courseId} schoolId={schoolId} />
      {children}
    </div>
  )
}

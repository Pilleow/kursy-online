'use client'

import Link from 'next/link'
import { BookOpen, ClipboardList, MessageSquare, ChevronRight } from 'lucide-react'
import { useInstructorAssignments, useInstructorStats } from '@/lib/hooks/useInstructorStats'
import type { AssignedModule } from '@/lib/api/instructor'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({ label, value, icon }: { label: string; value: number | undefined; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
          {value ?? <Skeleton className="h-7 w-8" />}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  )
}

export default function InstructorDashboardPage() {
  const { data: assignments, isLoading: loadingModules } = useInstructorAssignments()
  const { data: stats } = useInstructorStats()

  // Group modules by course
  const byCourse = assignments?.reduce<
    Record<string, { courseId: string; courseTitle: string; modules: AssignedModule[] }>
  >((acc, a) => {
    const cid = a.module.course.id
    if (!acc[cid]) {
      acc[cid] = { courseId: cid, courseTitle: a.module.course.title, modules: [] }
    }
    acc[cid].modules.push(a)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your assigned modules and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending homework"
          value={stats?.pendingHomeworkCount}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Unanswered Q&A"
          value={stats?.unreadQACount}
          icon={<MessageSquare className="h-5 w-5" />}
        />
      </div>

      {/* Assigned modules */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Assigned Modules
        </h2>

        {loadingModules && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!loadingModules && (!byCourse || Object.keys(byCourse).length === 0) && (
          <p className="text-sm text-gray-400">No modules assigned yet.</p>
        )}

        {byCourse &&
          Object.values(byCourse).map(({ courseId, courseTitle, modules }) => (
            <div key={courseId} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 dark:bg-gray-800/60">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {courseTitle}
                </span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {modules.map((a) => (
                  <li key={a.assignmentId}>
                    <Link
                      href={`/instructor/courses/${courseId}/modules/${a.module.id}`}
                      className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/40"
                    >
                      <span>{a.module.title}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{a.module._count?.lessons ?? 0} lessons</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

import {
  BookOpen,
  ClipboardList,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  FileText,
} from 'lucide-react'
import { useInstructorAssignments, useInstructorPendingSubmissions } from '@/lib/hooks/useInstructorStats'
import type { AssignedModule, PendingSubmission } from '@/lib/api/instructor'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ assignment }: { assignment: AssignedModule }) {
  const { module } = assignment
  const courseId = module.course.id
  const lessonCount = module._count?.lessons ?? 0

  return (
    <Link
      href={`/instructor/courses/${courseId}/modules/${module.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary dark:text-gray-50">
          {module.title}
        </p>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary dark:text-gray-600" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <BookOpen className="h-3 w-3" />
          {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
        </span>

        {module.pendingHomeworkCount > 0 && (
          <Badge
            variant="secondary"
            className="gap-1 bg-orange-50 text-orange-700 hover:bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 text-[11px] font-medium px-2 py-0.5"
          >
            <ClipboardList className="h-3 w-3" />
            {module.pendingHomeworkCount} pending
          </Badge>
        )}

        {module.unreadQACount > 0 && (
          <Badge
            variant="secondary"
            className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 text-[11px] font-medium px-2 py-0.5"
          >
            <MessageSquare className="h-3 w-3" />
            {module.unreadQACount} question{module.unreadQACount !== 1 ? 's' : ''}
          </Badge>
        )}

        {module.pendingHomeworkCount === 0 && module.unreadQACount === 0 && (
          <span className="text-[11px] text-gray-400 dark:text-gray-600">All clear</span>
        )}
      </div>
    </Link>
  )
}

// ─── Course accordion ─────────────────────────────────────────────────────────

type CourseGroup = { courseId: string; courseTitle: string; modules: AssignedModule[] }

function CourseAccordion({ group }: { group: CourseGroup }) {
  const [open, setOpen] = useState(true)
  const hasAttention = group.modules.some(
    (a) => a.module.pendingHomeworkCount > 0 || a.module.unreadQACount > 0,
  )

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 bg-gray-50 px-5 py-3 text-left hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800 transition-colors"
      >
        <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="flex-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
          {group.courseTitle}
        </span>
        {hasAttention && !open && (
          <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" title="Needs attention" />
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.modules.map((a) => (
            <ModuleCard key={a.assignmentId} assignment={a} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── My Modules Cards ─────────────────────────────────────────────────────────

function MyModulesCards() {
  const { data: assignments, isLoading } = useInstructorAssignments()

  const courseGroups = useMemo<CourseGroup[]>(() => {
    if (!assignments) return []
    const map = new Map<string, CourseGroup>()
    for (const a of assignments) {
      const { course } = a.module
      if (!map.has(course.id)) {
        map.set(course.id, { courseId: course.id, courseTitle: course.title, modules: [] })
      }
      map.get(course.id)!.modules.push(a)
    }
    return Array.from(map.values())
  }, [assignments])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (courseGroups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
        No modules assigned yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {courseGroups.map((group) => (
        <CourseAccordion key={group.courseId} group={group} />
      ))}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Quick Feedback row ───────────────────────────────────────────────────────

function QuickFeedbackRow({ sub }: { sub: PendingSubmission }) {
  const age = timeAgo(sub.submittedAt)

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {sub.studentName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
            {sub.studentName}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub.courseName}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{sub.lessonTitle}</span>
          <span>·</span>
          <span className="shrink-0">{age}</span>
        </div>
      </div>

      <Button asChild size="sm" variant="outline" className="shrink-0 text-xs">
        <Link href={`/instructor/courses/${sub.courseId}/homework`}>
          Give Feedback
        </Link>
      </Button>
    </div>
  )
}

// ─── Quick Feedback section ───────────────────────────────────────────────────

function QuickFeedback() {
  const { data: submissions, isLoading } = useInstructorPendingSubmissions()

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Waiting for Feedback
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-600">5 most recent</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {isLoading && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 px-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!submissions || submissions.length === 0) && (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
            No submissions waiting for feedback.
          </div>
        )}

        {!isLoading && submissions && submissions.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 px-5">
            {submissions.map((sub) => (
              <QuickFeedbackRow key={sub.submissionId} sub={sub} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstructorDashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your assigned modules and tasks waiting for attention
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          My Modules
        </h2>
        <MyModulesCards />
      </section>

      <QuickFeedback />
    </div>
  )
}

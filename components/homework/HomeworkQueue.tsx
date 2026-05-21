'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useInstructorPendingSubmissions } from '@/lib/hooks/useInstructorStats'
import { listCourseHomeworks, listSubmissions } from '@/lib/api/homework'
import type { SubmissionWithUser, HomeworkWithSubmissionCount } from '@/lib/api/homework'
import { HomeworkDetail } from './HomeworkDetail'

type Tab = 'pending' | 'graded'

type SelectedSubmission = {
  submissionId: string
  homeworkId: string
  studentName: string
}

type GradedRow = SubmissionWithUser & { homework: HomeworkWithSubmissionCount }

async function fetchGradedRows(courseId: string): Promise<GradedRow[]> {
  const homeworks = await listCourseHomeworks(courseId)
  const nested = await Promise.all(
    homeworks.map(async (hw) => {
      const subs = await listSubmissions(hw.id)
      if (!Array.isArray(subs)) return []
      return (subs as SubmissionWithUser[])
        .filter((s) => !!s.feedback)
        .map((s) => ({ ...s, homework: hw }))
    }),
  )
  return nested
    .flat()
    .sort((a, b) => new Date(b.feedbackAt!).getTime() - new Date(a.feedbackAt!).getTime())
}

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-52 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-8 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-400">
      {message}
    </div>
  )
}

function SubmissionRow({
  initials,
  studentName,
  homeworkTitle,
  lessonTitle,
  timestamp,
  graded,
  onView,
}: {
  initials: string
  studentName: string
  homeworkTitle: string
  lessonTitle: string
  timestamp: string
  graded: boolean
  onView: () => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {studentName}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {lessonTitle}
          <span className="mx-1 text-gray-300 dark:text-gray-600">/</span>
          {homeworkTitle}
        </p>
      </div>

      {/* Status badge */}
      <div className="shrink-0 hidden sm:flex items-center gap-1 text-xs font-medium">
        {graded ? (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Graded
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        )}
      </div>

      {/* Timestamp */}
      <p className="shrink-0 text-xs text-gray-400 hidden md:block w-20 text-right">
        {timeAgo(timestamp)}
      </p>

      {/* Action */}
      <Button size="sm" variant={graded ? 'outline' : 'default'} onClick={onView} className="shrink-0">
        <ExternalLink className="h-3.5 w-3.5" />
        {graded ? 'View' : 'View & Grade'}
      </Button>
    </div>
  )
}

export function HomeworkQueue({ courseId }: { courseId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [selected, setSelected] = useState<SelectedSubmission | null>(null)

  const { data: allPending = [], isLoading: pendingLoading } = useInstructorPendingSubmissions()

  const pending = allPending
    .filter((s) => s.courseId === courseId)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())

  const { data: graded = [], isLoading: gradedLoading } = useQuery({
    queryKey: ['course-homework-graded', courseId],
    queryFn: () => fetchGradedRows(courseId),
    enabled: activeTab === 'graded',
  })

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'graded', label: 'Graded' },
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Summary banner */}
        {!pendingLoading && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm',
              pending.length > 0
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
            )}
          >
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            {pending.length > 0 ? (
              <span>
                <span className="font-semibold">{pending.length}</span> submission
                {pending.length !== 1 ? 's' : ''} waiting for feedback
              </span>
            ) : (
              <span>All caught up — no pending submissions!</span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-1 w-fit">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors',
                activeTab === key
                  ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
                    activeTab === key
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-gray-900'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending tab */}
        {activeTab === 'pending' && (
          <>
            {pendingLoading ? (
              <LoadingSkeleton />
            ) : pending.length === 0 ? (
              <EmptyState message="No pending submissions — all caught up!" />
            ) : (
              <div className="space-y-2">
                {pending.map((s) => {
                  const parts = s.studentName.trim().split(' ')
                  const initials = (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')
                  return (
                    <SubmissionRow
                      key={s.submissionId}
                      initials={initials.toUpperCase()}
                      studentName={s.studentName}
                      homeworkTitle={s.homeworkTitle}
                      lessonTitle={s.lessonTitle}
                      timestamp={s.submittedAt}
                      graded={false}
                      onView={() =>
                        setSelected({
                          submissionId: s.submissionId,
                          homeworkId: s.homeworkId,
                          studentName: s.studentName,
                        })
                      }
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Graded tab */}
        {activeTab === 'graded' && (
          <>
            {gradedLoading ? (
              <LoadingSkeleton />
            ) : graded.length === 0 ? (
              <EmptyState message="No graded submissions yet." />
            ) : (
              <div className="space-y-2">
                {graded.map((s) => {
                  const initials = (
                    (s.user.firstName[0] ?? '') + (s.user.lastName[0] ?? '')
                  ).toUpperCase()
                  return (
                    <SubmissionRow
                      key={s.id}
                      initials={initials}
                      studentName={`${s.user.firstName} ${s.user.lastName}`}
                      homeworkTitle={s.homework.title}
                      lessonTitle={s.homework.lesson.title}
                      timestamp={String(s.feedbackAt ?? s.submittedAt)}
                      graded
                      onView={() =>
                        setSelected({
                          submissionId: s.id,
                          homeworkId: s.homeworkId,
                          studentName: `${s.user.firstName} ${s.user.lastName}`,
                        })
                      }
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <HomeworkDetail
          open={!!selected}
          onClose={() => setSelected(null)}
          homeworkId={selected.homeworkId}
          submissionId={selected.submissionId}
          studentName={selected.studentName}
          courseId={courseId}
        />
      )}
    </>
  )
}

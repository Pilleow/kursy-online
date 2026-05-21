'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, X } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { getHomework, listSubmissions } from '@/lib/api/homework'
import type { SubmissionWithUser } from '@/lib/api/homework'
import type { HomeworkQuestion } from '@/lib/types'
import { FeedbackForm } from './FeedbackForm'

type Props = {
  open: boolean
  onClose: () => void
  homeworkId: string
  submissionId: string
  studentName: string
  courseId: string
}

function fmt(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HomeworkDetail({
  open,
  onClose,
  homeworkId,
  submissionId,
  studentName,
  courseId,
}: Props) {
  const qc = useQueryClient()

  const { data: homework } = useQuery({
    queryKey: ['homework', homeworkId],
    queryFn: () => getHomework(homeworkId),
    enabled: open,
  })

  const { data: allSubs } = useQuery({
    queryKey: ['submissions', homeworkId],
    queryFn: () => listSubmissions(homeworkId),
    enabled: open,
  })

  const submission = Array.isArray(allSubs)
    ? (allSubs as SubmissionWithUser[]).find((s) => s.id === submissionId) ?? null
    : null

  function handleFeedbackSuccess() {
    qc.invalidateQueries({ queryKey: ['instructor', 'pending-submissions'] })
    qc.invalidateQueries({ queryKey: ['instructor', 'stats'] })
    qc.invalidateQueries({ queryKey: ['instructor', 'assignments'] })
    qc.invalidateQueries({ queryKey: ['course-homework-graded', courseId] })
    qc.invalidateQueries({ queryKey: ['submissions', homeworkId] })
    onClose()
  }

  const isLoading = !homework || !submission

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay — no animation */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />

        {/* Content — no animation, wide, centered */}
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl p-0 focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate">
                {homework?.title ?? 'Homework submission'}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 truncate">
                {studentName}
                {submission?.submittedAt ? ` · submitted ${fmt(submission.submittedAt)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Status badge */}
              {submission && (
                submission.feedback ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Graded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    Pending
                  </span>
                )
              )}
              <DialogPrimitive.Close className="rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Skeleton */}
            {isLoading && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            )}

            {/* Questions & answers */}
            {homework && submission && (
              <div className="space-y-5">
                {homework.questions.map((q: HomeworkQuestion, idx: number) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {idx + 1}. {q.text}
                      {q.required && <span className="ml-1 text-red-400">*</span>}
                    </p>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap min-h-[2.5rem] font-mono leading-relaxed">
                      {(submission.answers as Record<string, string>)[q.id] ?? (
                        <span className="italic font-sans text-gray-400">No answer provided</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Existing feedback */}
            {submission?.feedback && (
              <div className="rounded-lg border border-green-100 dark:border-green-800 bg-green-50/60 dark:bg-green-900/10 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                  Your feedback
                  {submission.feedbackAt && (
                    <span className="ml-2 font-normal text-green-500">· {fmt(submission.feedbackAt)}</span>
                  )}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              </div>
            )}

            {/* Feedback form */}
            {submission && !submission.feedback && (
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Leave feedback</p>
                <FeedbackForm submissionId={submission.id} onSuccess={handleFeedbackSuccess} />
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

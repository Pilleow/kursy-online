'use client'

import { Clock, CheckCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HomeworkSubmission } from '@/lib/types'

type Props = {
  submission: HomeworkSubmission
  instructorName?: string
  onCompleteLesson?: () => void
  completingLesson?: boolean
}

export function FeedbackDisplay({ submission, instructorName, onCompleteLesson, completingLesson }: Props) {
  const hasFeedback = !!submission.feedbackAt

  if (!hasFeedback) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 flex items-center gap-3">
        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700">Awaiting feedback — your instructor will review your answers soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-100 bg-green-50/50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">Feedback received</span>
        </div>

        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            {instructorName ? `Reviewed by ${instructorName}` : 'Reviewed by instructor'}
            {' · '}
            {new Date(submission.feedbackAt!).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {onCompleteLesson && (
        <Button onClick={onCompleteLesson} disabled={completingLesson} className="w-full">
          {completingLesson ? 'Completing…' : 'Complete Lesson'}
        </Button>
      )}
    </div>
  )
}

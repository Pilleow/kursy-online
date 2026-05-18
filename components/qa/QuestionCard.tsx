'use client'

import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnswerForm } from './AnswerForm'
import type { QAQuestionWithMeta } from '@/lib/api/qa'

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

type Props = {
  question: QAQuestionWithMeta
  lessonId: string
  onUpvote: (questionId: string) => void
  upvoting: boolean
}

export function QuestionCard({ question: q, lessonId, onUpvote, upvoting }: Props) {
  return (
    <li className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-start gap-3">
        {/* Upvote button */}
        <button
          onClick={() => onUpvote(q.id)}
          disabled={upvoting}
          className={cn(
            'flex flex-col items-center gap-0.5 min-w-[36px] text-xs font-medium transition-colors disabled:opacity-50',
            q.hasUpvoted
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          )}
        >
          <ThumbsUp className="h-4 w-4" />
          {q.upvotes}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Question body */}
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{q.body}</p>
          <p className="text-xs text-gray-400">
            {q.user.firstName} {q.user.lastName} · {timeAgo(q.createdAt)}
          </p>

          {/* Answer block */}
          {q.answer && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                Instructor answer
                {q.answeredAt && (
                  <span className="font-normal text-blue-500 dark:text-blue-400 ml-2">
                    · {timeAgo(q.answeredAt)}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {q.answer}
              </p>
            </div>
          )}

          {/* Answer form — instructors only */}
          <AnswerForm questionId={q.id} lessonId={lessonId} existingAnswer={q.answer ?? undefined} />
        </div>
      </div>
    </li>
  )
}

'use client'

import { useState } from 'react'
import { ThumbsUp, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCourseQA, useAnswerCourseQuestion } from '@/lib/hooks/useInstructorQA'
import type { QAQuestionWithContext } from '@/lib/api/qa'

type Filter = 'unanswered' | 'answered' | 'all'

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function InlineAnswerForm({
  questionId,
  courseId,
  onClose,
}: {
  questionId: string
  courseId: string
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const { mutate, isPending } = useAnswerCourseQuestion(courseId)

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    mutate({ questionId, body: { text: trimmed } }, { onSuccess: onClose })
  }

  return (
    <div className="space-y-2 pt-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write an answer…"
        rows={3}
        autoFocus
        className="w-full resize-none rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-50"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isPending || !text.trim()}>
          {isPending ? 'Sending…' : 'Send answer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function QuestionCard({
  question: q,
  courseId,
}: {
  question: QAQuestionWithContext
  courseId: string
}) {
  const [answerOpen, setAnswerOpen] = useState(false)
  const isUnanswered = !q.answer

  return (
    <li className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-start gap-3">
        {/* Upvote */}
        <div className="flex flex-col items-center gap-0.5 min-w-[36px] text-xs font-medium text-gray-400">
          <ThumbsUp className="h-4 w-4" />
          {q.upvotes}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Context breadcrumb */}
          <p className="text-[11px] text-gray-400 truncate">
            {q.moduleTitle}
            <span className="mx-1 text-gray-300 dark:text-gray-600">/</span>
            {q.lessonTitle}
          </p>

          {/* Question */}
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{q.body}</p>

          {/* Meta */}
          <p className="text-xs text-gray-400">
            {q.user.firstName} {q.user.lastName} · {timeAgo(q.createdAt)}
          </p>

          {/* Unanswered badge */}
          {isUnanswered && (
            <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:text-orange-400">
              Unanswered
            </span>
          )}

          {/* Existing answer */}
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

          {/* Inline answer form for unanswered */}
          {isUnanswered && (
            answerOpen ? (
              <InlineAnswerForm
                questionId={q.id}
                courseId={courseId}
                onClose={() => setAnswerOpen(false)}
              />
            ) : (
              <button
                onClick={() => setAnswerOpen(true)}
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Answer
              </button>
            )
          )}

          {/* Edit answer for answered questions */}
          {!isUnanswered && (
            answerOpen ? (
              <InlineAnswerForm
                questionId={q.id}
                courseId={courseId}
                onClose={() => setAnswerOpen(false)}
              />
            ) : (
              <button
                onClick={() => setAnswerOpen(true)}
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Edit answer
              </button>
            )
          )}
        </div>
      </div>
    </li>
  )
}

export function UnreadQACount({ courseId }: { courseId: string }) {
  const { data: questions = [] } = useCourseQA(courseId)
  const count = questions.filter((q) => !q.answer).length
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700 dark:text-orange-400">
      <MessageSquare className="h-3 w-3" />
      {count} unanswered
    </span>
  )
}

export function QAList({ courseId }: { courseId: string }) {
  const [filter, setFilter] = useState<Filter>('unanswered')
  const { data: questions = [], isLoading, isError } = useCourseQA(courseId)

  const unreadCount = questions.filter((q) => !q.answer).length

  const filtered = questions.filter((q) => {
    if (filter === 'unanswered') return !q.answer
    if (filter === 'answered') return !!q.answer
    return true
  })

  const sorted =
    filter === 'all'
      ? [...filtered].sort((a, b) => {
          if (!a.answer && b.answer) return -1
          if (a.answer && !b.answer) return 1
          return 0
        })
      : filtered

  const filters: { key: Filter; label: string }[] = [
    { key: 'unanswered', label: 'Unanswered' },
    { key: 'answered', label: 'Answered' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {unreadCount > 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-4 py-2 text-sm text-orange-700 dark:text-orange-300">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-semibold">{unreadCount}</span> unanswered question
              {unreadCount !== 1 ? 's' : ''} waiting for a response
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-2 text-sm text-green-700 dark:text-green-300">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>All caught up — no unanswered questions!</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-1 shrink-0">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors',
                filter === key
                  ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Question list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading questions…</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Failed to load questions.</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-400">
          {filter === 'unanswered'
            ? 'No unanswered questions — all caught up!'
            : filter === 'answered'
              ? 'No answered questions yet.'
              : 'No questions in this course yet.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((q) => (
            <QuestionCard key={q.id} question={q} courseId={courseId} />
          ))}
        </ul>
      )}
    </div>
  )
}

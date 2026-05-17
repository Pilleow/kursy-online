'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuizWithQuestions } from '@/lib/api/quizzes'

export type QuizMode = 'all' | 'one'

type Props = {
  quiz: QuizWithQuestions
  onSubmit: (answers: Record<string, string>) => Promise<void>
  submitting?: boolean
  error?: string | null
  mode?: QuizMode
}

type Question = QuizWithQuestions['questions'][number]

export function QuizForm({ quiz, onSubmit, submitting = false, error, mode = 'all' }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeIdx, setActiveIdx] = useState(0)

  const { questions } = quiz
  const answeredCount = Object.keys(answers).length
  const allAnswered = questions.every((q) => !!answers[q.id])

  function setRadio(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleCheckbox(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ? prev[questionId].split(',') : []
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      if (next.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [questionId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [questionId]: next.join(',') }
    })
  }

  function renderQuestion(q: Question, idx: number) {
    const isMultiple = q.type === 'multiple_choice'
    const selectedItems = isMultiple ? (answers[q.id] ?? '').split(',').filter(Boolean) : []

    return (
      <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <p className="text-sm font-medium text-gray-900">
          <span className="text-gray-400 mr-2">{idx + 1}.</span>
          {q.text}
        </p>
        {isMultiple && (
          <p className="text-xs text-gray-400">Select all that apply</p>
        )}
        <div className="flex flex-col gap-2">
          {(q.options as string[]).map((opt) => {
            if (isMultiple) {
              const checked = selectedItems.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleCheckbox(q.id, opt)}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                    checked
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                      checked ? 'border-primary bg-primary' : 'border-gray-300 bg-white',
                    )}
                  >
                    {checked && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {opt}
                </button>
              )
            }

            const isSelected = answers[q.id] === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setRadio(q.id, opt)}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white',
                  )}
                >
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    if (!allAnswered || submitting) return
    await onSubmit(answers)
  }

  if (mode === 'one') {
    const q = questions[activeIdx]
    const isLast = activeIdx === questions.length - 1
    const currentAnswered = !!answers[q?.id]

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Question {activeIdx + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-1 w-full rounded-full bg-gray-100">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(activeIdx / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {q && renderQuestion(q, activeIdx)}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setActiveIdx((i) => i - 1)}
            disabled={activeIdx === 0}
          >
            Previous
          </Button>
          {isLast ? (
            <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button onClick={() => setActiveIdx((i) => i + 1)} disabled={!currentAnswered}>
              Next
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-5">
        {questions.map((q, idx) => renderQuestion(q, idx))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {answeredCount} / {questions.length} answered
        </p>
        <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
          {submitting ? 'Submitting…' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  )
}

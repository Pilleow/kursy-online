'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { CheckCircle, Clock, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getHomework,
  listSubmissions,
  submitHomework,
  type HomeworkWithQuestions,
} from '@/lib/api/homework'
import type { HomeworkSubmission } from '@/lib/types'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/authStore'

type Screen = 'loading' | 'form' | 'submitted'

export function HomeworkPlayer({ hwId }: { hwId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasLoaded = useRef(false)

  const [screen, setScreen] = useState<Screen>('loading')
  const [homework, setHomework] = useState<HomeworkWithQuestions | null>(null)
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setScreen('loading')
    setError(null)
    try {
      const [hw, sub] = await Promise.allSettled([getHomework(hwId), listSubmissions(hwId)])

      if (hw.status === 'rejected') throw new Error('Homework not found')
      setHomework(hw.value)

      if (sub.status === 'fulfilled' && sub.value && !Array.isArray(sub.value)) {
        setSubmission(sub.value as HomeworkSubmission)
        setScreen('submitted')
      } else {
        setScreen('form')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load homework')
      setScreen('form')
    }
  }, [hwId])

  useEffect(() => {
    if (!accessToken || hasLoaded.current) return
    hasLoaded.current = true
    load()
  }, [accessToken, load])

  async function handleSubmit() {
    if (!homework) return
    const missing = homework.questions.filter((q) => q.required && !answers[q.id])
    if (missing.length > 0) {
      setError(`Please answer all required questions (${missing.length} remaining)`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitHomework(hwId, { answers })
      setSubmission(result)
      setScreen('submitted')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('You already submitted this homework.')
      } else {
        setError(e instanceof Error ? e.message : 'Submission failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (screen === 'loading') {
    return (
      <div className="flex flex-col gap-4 animate-pulse max-w-2xl mx-auto">
        <div className="h-7 w-64 rounded bg-gray-100" />
        <div className="h-4 w-48 rounded bg-gray-100" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-24 w-full rounded-lg bg-gray-50" />
          </div>
        ))}
      </div>
    )
  }

  if (screen === 'submitted' && submission) {
    const hasFeedback = !!submission.feedback
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6 text-gray-500" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <div className="flex flex-col items-center py-10 text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submitted!</h2>
            <p className="text-sm text-gray-500 mt-1">
              {hasFeedback
                ? 'Your instructor has reviewed your submission.'
                : 'Waiting for instructor feedback.'}
            </p>
          </div>
        </div>

        {hasFeedback ? (
          <div className="mt-2 rounded-xl border border-green-100 bg-green-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Instructor Feedback</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
            {submission.feedbackAt && (
              <p className="mt-3 text-xs text-gray-400">
                Reviewed on {new Date(submission.feedbackAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/50 p-4 flex items-center gap-3">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">Your instructor will review your answers soon.</p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Your answers
          </h3>
          {homework?.questions.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
                {q.text}
              </p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                {(submission.answers as Record<string, string>)[q.id] ?? (
                  <span className="text-gray-400 italic">No answer</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" className="-ml-2 mb-6 text-gray-500" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{homework?.title}</h1>
        {homework?.description && (
          <p className="mt-2 text-sm text-gray-500">{homework.description}</p>
        )}
        {homework?.dueAt && (
          <p className="mt-1 text-xs text-amber-600">
            Due {new Date(homework.dueAt).toLocaleDateString()}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-400">
          {homework?.questions.length} question{homework?.questions.length !== 1 ? 's' : ''}
          {homework?.questions.some((q) => q.required) && ' · required questions marked *'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex flex-col gap-5">
        {homework?.questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-900 mb-3">
              <span className="text-gray-400 mr-2">{idx + 1}.</span>
              {q.text}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            <textarea
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'resize-y min-h-[80px]',
                answers[q.id] ? 'border-gray-200' : 'border-gray-200',
              )}
              placeholder={q.type === 'file_upload' ? 'Paste a link or describe your upload…' : 'Write your answer…'}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {Object.values(answers).filter(Boolean).length} / {homework?.questions.length ?? 0} answered
        </p>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Homework'}
        </Button>
      </div>
    </div>
  )
}

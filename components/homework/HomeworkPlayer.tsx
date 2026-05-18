'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  getHomework,
  listSubmissions,
  submitHomework,
  type HomeworkWithQuestions,
} from '@/lib/api/homework'
import { completeLesson } from '@/lib/api/progress'
import type { HomeworkSubmission } from '@/lib/types'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/authStore'
import { HomeworkForm } from './HomeworkForm'
import { FeedbackDisplay } from './FeedbackDisplay'

type Screen = 'loading' | 'form' | 'submitted'

type Props = {
  hwId: string
  courseSlug: string
  returnLessonId?: string
}

export function HomeworkPlayer({ hwId, courseSlug, returnLessonId }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const router = useRouter()
  const hasLoaded = useRef(false)

  const [screen, setScreen] = useState<Screen>('loading')
  const [homework, setHomework] = useState<HomeworkWithQuestions | null>(null)
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completingLesson, setCompletingLesson] = useState(false)

  const load = useCallback(async () => {
    setScreen('loading')
    setSubmitError(null)
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
      setSubmitError(e instanceof Error ? e.message : 'Failed to load homework')
      setScreen('form')
    }
  }, [hwId])

  useEffect(() => {
    if (!accessToken || hasLoaded.current) return
    hasLoaded.current = true
    load()
  }, [accessToken, load])

  async function handleSubmit(answers: Record<string, string>) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await submitHomework(hwId, { answers })
      setSubmission(result)
      setScreen('submitted')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSubmitError('You already submitted this homework.')
      } else {
        setSubmitError(e instanceof Error ? e.message : 'Submission failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCompleteLesson() {
    if (!homework) return
    setCompletingLesson(true)
    const backHref = returnLessonId
      ? `/learn/${courseSlug}?lesson=${returnLessonId}`
      : `/learn/${courseSlug}`
    try {
      await completeLesson(homework.lessonId)
      router.push(backHref)
    } catch {
      router.push(backHref)
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

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" className="-ml-2 mb-6 text-gray-500" asChild>
        <Link href={returnLessonId ? `/learn/${courseSlug}?lesson=${returnLessonId}` : `/learn/${courseSlug}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>
      </Button>

      {/* Header */}
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

      {/* Submitted state */}
      {screen === 'submitted' && submission && homework ? (
        <div className="space-y-8">
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-7 w-7 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Submitted!</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {submission.feedbackAt
                  ? 'Your instructor has reviewed your submission.'
                  : 'Waiting for instructor feedback.'}
              </p>
            </div>
          </div>

          <FeedbackDisplay
            submission={submission}
            onCompleteLesson={submission.feedbackAt ? handleCompleteLesson : undefined}
            completingLesson={completingLesson}
          />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Your answers
            </h3>
            <HomeworkForm
              homework={homework}
              onSubmit={async () => {}}
              readOnly
              existingAnswers={submission.answers as Record<string, string>}
            />
          </div>
        </div>
      ) : (
        /* Form state */
        homework && (
          <HomeworkForm
            homework={homework}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={submitError}
          />
        )
      )}
    </div>
  )
}

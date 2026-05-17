'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuizForm } from './QuizForm'
import { QuizResult } from './QuizResult'
import { CooldownMessage } from './CooldownMessage'
import {
  getQuiz,
  getLatestAttempt,
  submitQuizAttempt,
  type QuizWithQuestions,
  type SubmitAttemptResponse,
} from '@/lib/api/quizzes'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/authStore'

type Screen = 'loading' | 'cooldown' | 'quiz' | 'result'

type Props = {
  quizId: string
  courseSlug?: string
}

export function QuizPlayer({ quizId, courseSlug }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasLoaded = useRef(false)

  const [screen, setScreen] = useState<Screen>('loading')
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setScreen('loading')
    setLoadError(null)
    setSubmitError(null)
    setResult(null)
    try {
      const [quizData, latestAttempt] = await Promise.allSettled([
        getQuiz(quizId),
        getLatestAttempt(quizId),
      ])

      if (quizData.status === 'rejected') throw new Error('Quiz not found')
      setQuiz(quizData.value)

      if (
        latestAttempt.status === 'fulfilled' &&
        latestAttempt.value.cooldownUntil &&
        new Date(latestAttempt.value.cooldownUntil).getTime() > Date.now()
      ) {
        setCooldownUntil(latestAttempt.value.cooldownUntil)
        setScreen('cooldown')
      } else {
        setScreen('quiz')
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load quiz')
      setScreen('quiz')
    }
  }, [quizId])

  useEffect(() => {
    if (!accessToken || hasLoaded.current) return
    hasLoaded.current = true
    load()
  }, [accessToken, load])

  async function handleSubmit(answers: Record<string, string>) {
    if (!quiz) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))
      const res = await submitQuizAttempt(quizId, payload)
      setResult(res)
      if (res.cooldownUntil) setCooldownUntil(res.cooldownUntil)
      setScreen('result')
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        const body = e.body as { cooldownUntil?: string }
        if (body.cooldownUntil) setCooldownUntil(body.cooldownUntil)
        setScreen('cooldown')
      } else {
        setSubmitError(e instanceof Error ? e.message : 'Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const backHref = courseSlug ? `/learn/${courseSlug}` : '/dashboard'

  if (screen === 'loading') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-pulse">
        <div className="h-7 w-48 rounded bg-gray-100" />
        <div className="h-4 w-32 rounded bg-gray-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-9 w-full rounded-lg bg-gray-50" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (screen === 'cooldown' && cooldownUntil) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" className="-ml-2 mb-3 text-gray-500" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {courseSlug ? 'Back to Course' : 'Dashboard'}
          </Link>
        </Button>
        <CooldownMessage cooldownUntil={cooldownUntil} onRetry={load} />
      </div>
    )
  }

  if (screen === 'result' && result && quiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" className="-ml-2 mb-3 text-gray-500" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {courseSlug ? 'Back to Course' : 'Dashboard'}
          </Link>
        </Button>
        <QuizResult result={result} quiz={quiz} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="-ml-2 mb-3 text-gray-500" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {courseSlug ? 'Back to Course' : 'Dashboard'}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">{quiz?.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {quiz?.questions.length} question{quiz?.questions.length !== 1 ? 's' : ''} · answer all to submit
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>
      )}

      {quiz && (
        <QuizForm
          quiz={quiz}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Clock, RotateCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

function formatCountdown(until: string): string {
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function QuizPlayer({ quizId }: { quizId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasLoaded = useRef(false)

  const [screen, setScreen] = useState<Screen>('loading')
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setScreen('loading')
    setError(null)
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
        setAnswers({})
        setScreen('quiz')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz')
      setScreen('quiz')
    }
  }, [quizId])

  // Wait for the silent-refresh in StudentShell to populate the token before fetching.
  useEffect(() => {
    if (!accessToken || hasLoaded.current) return
    hasLoaded.current = true
    load()
  }, [accessToken, load])

  useEffect(() => {
    if (screen !== 'cooldown' || !cooldownUntil) return
    const tick = () => {
      const remaining = formatCountdown(cooldownUntil)
      setCountdown(remaining)
      if (new Date(cooldownUntil).getTime() <= Date.now()) {
        setCooldownUntil(null)
        setScreen('quiz')
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [screen, cooldownUntil])

  async function handleSubmit() {
    if (!quiz) return
    const unanswered = quiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }
    setSubmitting(true)
    setError(null)
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
        setError(e instanceof Error ? e.message : 'Submission failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (screen === 'loading') {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
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

  if (screen === 'cooldown') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <Clock className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cooldown Active</h2>
          <p className="mt-1 text-sm text-gray-500">
            You can retake this quiz in
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-600">{countdown}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  if (screen === 'result' && result) {
    const passed = result.passed
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full',
            passed ? 'bg-green-50' : 'bg-red-50',
          )}
        >
          {passed ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <XCircle className="h-12 w-12 text-red-400" />
          )}
        </div>

        <div>
          <p className="text-5xl font-bold tabular-nums text-gray-900">{result.score}%</p>
          <p className={cn('mt-1 text-lg font-medium', passed ? 'text-green-600' : 'text-red-500')}>
            {passed ? 'Passed!' : 'Not passed'}
          </p>
          {quiz && (
            <p className="mt-1 text-sm text-gray-400">
              {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!passed && result.cooldownUntil && (
          <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
            Cooldown active — you can retake after{' '}
            {new Date(result.cooldownUntil).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          {!result.cooldownUntil && !passed && (
            <Button onClick={load}>
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="-ml-2 mb-3 text-gray-500" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">{quiz?.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {quiz?.questions.length} question{quiz?.questions.length !== 1 ? 's' : ''} · answer all to submit
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex flex-col gap-5">
        {quiz?.questions.map((q, idx) => (
          <div
            key={q.id}
            className={cn(
              'rounded-xl border p-5 transition-colors',
              answers[q.id] ? 'border-gray-200 bg-white' : 'border-gray-200 bg-white',
            )}
          >
            <p className="text-sm font-medium text-gray-900 mb-4">
              <span className="text-gray-400 mr-2">{idx + 1}.</span>
              {q.text}
            </p>
            <div className="flex flex-col gap-2">
              {(q.options as string[]).map((opt) => {
                const selected = answers[q.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                      selected
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                        selected ? 'border-primary bg-primary' : 'border-gray-300',
                      )}
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {Object.keys(answers).length} / {quiz?.questions.length ?? 0} answered
        </p>
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length !== (quiz?.questions.length ?? 0)}
        >
          {submitting ? 'Submitting…' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  )
}

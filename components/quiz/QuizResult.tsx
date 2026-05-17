'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CooldownMessage } from './CooldownMessage'
import { completeLesson } from '@/lib/api/progress'
import type { SubmitAttemptResponse, QuizWithQuestions } from '@/lib/api/quizzes'

type Props = {
  result: SubmitAttemptResponse
  quiz: QuizWithQuestions
  onRetry: () => void
}

export function QuizResult({ result, quiz, onRetry }: Props) {
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const { score, passed, cooldownUntil } = result
  const total = quiz.questions.length
  const correct = Math.round((score / 100) * total)

  async function handleComplete() {
    setCompleting(true)
    setCompleteError(null)
    try {
      await completeLesson(quiz.lessonId)
      setCompleted(true)
    } catch {
      setCompleteError('Failed to mark lesson as complete. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  if (!passed && cooldownUntil) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-red-100 bg-red-50 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums text-gray-900">
              {correct}/{total}
            </p>
            <p className="text-lg text-gray-500">{score}%</p>
            <Badge variant="destructive" className="mt-2">Failed</Badge>
          </div>
        </div>
        <CooldownMessage cooldownUntil={cooldownUntil} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-16 text-center gap-6">
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

      <div className="space-y-2">
        <p className="text-5xl font-bold tabular-nums text-gray-900">
          {correct}/{total}
        </p>
        <p className="text-2xl text-gray-500">{score}%</p>
        <Badge variant={passed ? 'default' : 'destructive'} className="text-sm px-3">
          {passed ? 'Passed' : 'Failed'}
        </Badge>
      </div>

      {passed && !completed && (
        <p className="rounded-xl bg-green-50 border border-green-100 px-6 py-4 text-sm text-green-700 max-w-sm">
          Congratulations! You passed with {score}%. Mark the lesson complete to track your progress.
        </p>
      )}

      {completed && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          Lesson marked as complete!
        </div>
      )}

      {completeError && (
        <p className="text-sm text-red-600">{completeError}</p>
      )}

      <div className="flex gap-3">
        {!passed && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        {passed && !completed && (
          <Button onClick={handleComplete} disabled={completing}>
            {completing ? 'Saving…' : 'Complete Lesson'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

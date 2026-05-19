'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQA, usePostQuestion, useUpvoteQuestion } from '@/lib/hooks/useQA'
import { useAuthStore } from '@/lib/store/authStore'
import { QuestionCard } from './QuestionCard'

type Sort = 'newest' | 'popular'

export function QASection({
  lessonId,
  onUnansweredCountChange,
}: {
  lessonId: string
  onUnansweredCountChange?: (lessonId: string, count: number) => void
}) {
  const role = useAuthStore((s) => s.role)
  const [sort, setSort] = useState<Sort>('newest')
  const [newBody, setNewBody] = useState('')

  const { data: questions = [], isLoading, isError } = useQA(lessonId, sort)

  useEffect(() => {
    if (!onUnansweredCountChange || isLoading) return
    const count = questions.filter((q) => !q.answer).length
    onUnansweredCountChange(lessonId, count)
  }, [questions, isLoading, lessonId, onUnansweredCountChange])
  const postQuestion = usePostQuestion(lessonId)
  const upvoteQuestion = useUpvoteQuestion(lessonId, sort)

  const canAsk = role === 'student'

  function handlePost() {
    const body = newBody.trim()
    if (!body) return
    postQuestion.mutate({ body }, { onSuccess: () => setNewBody('') })
  }

  return (
    <div className="space-y-6">
      {/* Header + sort tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Q&amp;A
          {questions.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({questions.length})</span>
          )}
        </h2>
        <div className="flex gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-1">
          {(['newest', 'popular'] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'px-3 py-1 text-xs rounded capitalize transition-colors',
                sort === s
                  ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Question list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading questions…</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Failed to load questions.</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-gray-400">No questions yet. Be the first to ask!</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              lessonId={lessonId}
              onUpvote={(questionId) => upvoteQuestion.mutate({ questionId })}
              upvoting={upvoteQuestion.isPending && upvoteQuestion.variables?.questionId === q.id}
            />
          ))}
        </ul>
      )}

      {/* Ask a question — students only */}
      {canAsk && (
        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Ask a question about this lesson…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-50"
          />
          <Button
            size="sm"
            onClick={handlePost}
            disabled={postQuestion.isPending || !newBody.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

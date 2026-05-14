'use client'

import { useEffect, useState, useCallback } from 'react'
import { ThumbsUp, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  listQA,
  postQuestion,
  answerQuestion,
  upvoteQuestion,
  type QAQuestionWithMeta,
} from '@/lib/api/qa'
import { useAuthStore } from '@/lib/store/authStore'

type Sort = 'newest' | 'popular'

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function QASection({ lessonId }: { lessonId: string }) {
  const { role, accessToken } = useAuthStore()

  const canAnswer = role === 'instructor' || role === 'school_admin'
  const canAsk = role === 'student'

  const [questions, setQuestions] = useState<QAQuestionWithMeta[]>([])
  const [sort, setSort] = useState<Sort>('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newBody, setNewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({})
  const [answeringSending, setAnsweringSending] = useState<string | null>(null)
  const [upvoting, setUpvoting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listQA(lessonId, sort)
      setQuestions(data)
    } catch {
      setError('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [lessonId, sort])

  useEffect(() => {
    if (accessToken) load()
  }, [accessToken, load])

  async function handlePost() {
    if (!newBody.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const q = await postQuestion(lessonId, { body: newBody.trim() })
      setQuestions((prev) => [q, ...prev])
      setNewBody('')
    } catch {
      setError('Failed to post question')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpvote(questionId: string) {
    setUpvoting(questionId)
    try {
      const result = await upvoteQuestion(questionId)
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, upvotes: result.upvotes, hasUpvoted: result.hasUpvoted }
            : q,
        ),
      )
    } catch {
      setError('Failed to toggle upvote')
    } finally {
      setUpvoting(null)
    }
  }

  async function handleAnswer(questionId: string) {
    const text = answerDraft[questionId]?.trim()
    if (!text) return
    setAnsweringSending(questionId)
    setError(null)
    try {
      const updated = await answerQuestion(questionId, { text })
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...updated } : q)))
      setAnswerDraft((prev) => ({ ...prev, [questionId]: '' }))
      setExpandedId(null)
    } catch {
      setError('Failed to submit answer')
    } finally {
      setAnsweringSending(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + sort */}
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

      {/* Ask a question — students only */}
      {canAsk && (
        <div className="flex gap-3">
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
            disabled={submitting || !newBody.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Question list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading questions…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-gray-400">No questions yet. Be the first to ask!</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
            >
              <div className="flex items-start gap-3">
                {/* Upvote button */}
                <button
                  onClick={() => handleUpvote(q.id)}
                  disabled={upvoting === q.id}
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
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {q.body}
                  </p>
                  <p className="text-xs text-gray-400">
                    {q.user.firstName} {q.user.lastName} · {timeAgo(q.createdAt)}
                  </p>

                  {/* Existing answer */}
                  {q.answer && (
                    <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3 py-2 space-y-1">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        Instructor answer
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {q.answer}
                      </p>
                    </div>
                  )}

                  {/* Answer form — instructors / school_admin only */}
                  {canAnswer && (
                    <div className="pt-1">
                      {expandedId === q.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={answerDraft[q.id] ?? ''}
                            onChange={(e) =>
                              setAnswerDraft((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder={q.answer ? 'Update your answer…' : 'Write an answer…'}
                            rows={3}
                            className="w-full resize-none rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-50"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAnswer(q.id)}
                              disabled={
                                answeringSending === q.id || !answerDraft[q.id]?.trim()
                              }
                            >
                              {answeringSending === q.id ? 'Sending…' : 'Send answer'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setExpandedId(q.id)
                            setAnswerDraft((prev) => ({
                              ...prev,
                              [q.id]: prev[q.id] ?? q.answer ?? '',
                            }))
                          }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          {q.answer ? (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              Edit answer
                            </>
                          ) : (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Answer
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

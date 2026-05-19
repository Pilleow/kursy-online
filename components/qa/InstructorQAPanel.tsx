'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { QASection } from './QASection'
import { useAuthStore } from '@/lib/store/authStore'
import type { Lesson } from '@/lib/types'

type ModuleSummary = { id: string; title: string }
type LessonSummary = Pick<Lesson, 'id' | 'title'> & { moduleTitle: string }

export function InstructorQAPanel({ courseId }: { courseId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [unansweredCounts, setUnansweredCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [modules, counts] = await Promise.all([
        apiFetch<ModuleSummary[]>(`/api/v1/courses/${courseId}/modules`),
        apiFetch<Record<string, number>>(`/api/v1/courses/${courseId}/qa-counts`),
      ])

      const flat: LessonSummary[] = []
      for (const mod of modules) {
        const ls = await apiFetch<Pick<Lesson, 'id' | 'title'>[]>(
          `/api/v1/modules/${mod.id}/lessons`,
        )
        for (const l of ls) {
          flat.push({ id: l.id, title: l.title, moduleTitle: mod.title })
        }
      }
      setLessons(flat)
      setUnansweredCounts(counts)
    } catch {
      setError('Failed to load lessons. Make sure you are assigned to this course.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (accessToken) load()
  }, [accessToken, load])

  function handleUnansweredCountChange(lessonId: string, count: number) {
    setUnansweredCounts((prev) => {
      if (count === 0) {
        const next = { ...prev }
        delete next[lessonId]
        return next
      }
      return { ...prev, [lessonId]: count }
    })
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading lessons…</p>
  }
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }
  if (lessons.length === 0) {
    return <p className="text-sm text-gray-400">No lessons found in this course.</p>
  }

  const totalUnanswered = Object.values(unansweredCounts).reduce((a, b) => a + b, 0)
  const visibleLessons = lessons.filter((l) => (unansweredCounts[l.id] ?? 0) > 0)

  return (
    <div className="space-y-4">
      {totalUnanswered > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{totalUnanswered}</span> unanswered question{totalUnanswered !== 1 ? 's' : ''} across this course
          </span>
        </div>
      )}

      {visibleLessons.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
          No unanswered questions — all caught up!
        </div>
      )}

      <div className="space-y-2">
        {visibleLessons.map((lesson) => {
          const isOpen = expandedLessonId === lesson.id
          const unanswered = unansweredCounts[lesson.id] ?? 0

          return (
            <div
              key={lesson.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Lesson row */}
              <button
                onClick={() => setExpandedLessonId(isOpen ? null : lesson.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-400">{lesson.moduleTitle}</p>
                </div>
                {unanswered > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                    <MessageSquare className="h-3 w-3" />
                    {unanswered}
                  </span>
                )}
              </button>

              {/* Expanded Q&A */}
              {isOpen && (
                <div className="px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                  <QASection lessonId={lesson.id} onUnansweredCountChange={handleUnansweredCountChange} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

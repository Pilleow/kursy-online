'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { QASection } from './QASection'
import { useAuthStore } from '@/lib/store/authStore'
import type { Lesson } from '@/lib/types'

type ModuleSummary = { id: string; title: string }
type LessonSummary = Pick<Lesson, 'id' | 'title'> & { moduleTitle: string }

export function InstructorQAPanel({ courseId }: { courseId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const modules = await apiFetch<ModuleSummary[]>(`/api/v1/courses/${courseId}/modules`)

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
    } catch {
      setError('Failed to load lessons. Make sure you are assigned to this course.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (accessToken) load()
  }, [accessToken, load])

  if (loading) {
    return <p className="text-sm text-gray-400">Loading lessons…</p>
  }
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }
  if (lessons.length === 0) {
    return <p className="text-sm text-gray-400">No lessons found in this course.</p>
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => {
        const isOpen = expandedLessonId === lesson.id
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
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {lesson.title}
                </p>
                <p className="text-xs text-gray-400">{lesson.moduleTitle}</p>
              </div>
            </button>

            {/* Expanded Q&A */}
            {isOpen && (
              <div className="px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <QASection lessonId={lesson.id} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

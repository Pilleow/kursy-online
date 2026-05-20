'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock } from 'lucide-react'
import { getLesson } from '@/lib/api/lessons'
import { QASection } from '@/components/qa/QASection'
import { TiptapRenderer } from './TiptapRenderer'
import { useAuthStore } from '@/lib/store/authStore'
import type { Lesson } from '@/lib/types'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonViewer({
  courseSlug,
  lessonId,
}: {
  courseSlug: string
  lessonId: string
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasLoaded = useRef(false)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLesson(lessonId)
      setLesson(data)
    } catch {
      setError('Lesson not found or you do not have access.')
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    if (!accessToken || hasLoaded.current) return
    hasLoaded.current = true
    load()
  }, [accessToken, load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Loading lesson…
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-red-500 text-sm">{error ?? 'Lesson not found.'}</p>
        <Link
          href={`/learn/${courseSlug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to course
        </Link>
      </div>
    )
  }

  const rawBlocks = Array.isArray(lesson.blocks) ? (lesson.blocks as { type: string; id?: string; html?: string }[]) : []
  const tiptapBlock = rawBlocks.find((b) => b.type === 'text' && b.id === 'tiptap-doc')

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">
      {/* Back link */}
      <Link
        href={`/learn/${courseSlug}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to course
      </Link>

      {/* Lesson header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
          <BookOpen className="h-3.5 w-3.5" />
          {lesson.type}
          {lesson.durationS != null && (
            <>
              <span>·</span>
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(lesson.durationS)}
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{lesson.title}</h1>
      </div>

      {/* Content blocks */}
      {tiptapBlock?.html ? (
        <div className="space-y-6">
          <TiptapRenderer tiptapJson={tiptapBlock.html} lessonId={lessonId} courseSlug={courseSlug} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
          No content blocks yet.
        </div>
      )}

      <hr className="border-gray-200 dark:border-gray-700" />
      <QASection lessonId={lessonId} />
    </div>
  )
}

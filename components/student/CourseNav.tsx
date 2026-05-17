'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, ChevronRight, ArrowRight, Lock, BookOpen, ListChecks, FileText } from 'lucide-react'
import type { ModuleSummary, LessonSummary } from '@/lib/api/courses'
import type { CompletionRequirements } from '@/lib/types'

type Props = {
  courseSlug: string
  modules: ModuleSummary[]
  currentLessonId: string | undefined
  completedLessonIds: string[]
  completionRequirements: CompletionRequirements | null | undefined
}

function LessonIcon({ type }: { type: LessonSummary['type'] }) {
  if (type === 'quiz') return <ListChecks className="h-3.5 w-3.5 shrink-0" />
  if (type === 'homework') return <FileText className="h-3.5 w-3.5 shrink-0" />
  return <BookOpen className="h-3.5 w-3.5 shrink-0" />
}

export function CourseNav({
  courseSlug,
  modules,
  currentLessonId,
  completedLessonIds,
  completionRequirements,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const requiresSequential = !!(completionRequirements as { requireAllLessons?: boolean } | null | undefined)?.requireAllLessons

  // Flat ordered list of all lessons for sequential lock logic
  const allLessons = modules.flatMap((m) => m.lessons)

  function isLocked(lesson: LessonSummary): boolean {
    if (!requiresSequential) return false
    const idx = allLessons.findIndex((l) => l.id === lesson.id)
    if (idx === 0) return false
    const prev = allLessons[idx - 1]
    return !completedLessonIds.includes(prev.id)
  }

  function handleLessonClick(lessonId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lesson', lessonId)
    router.push(`/learn/${courseSlug}?${params.toString()}`)
  }

  function toggleModule(moduleId: string) {
    setCollapsed((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  return (
    <nav className="space-y-1">
      {modules.map((module) => {
        const isOpen = !collapsed[module.id]
        const completedInModule = module.lessons.filter((l) => completedLessonIds.includes(l.id)).length
        return (
          <div key={module.id} className="rounded-lg border border-gray-100 overflow-hidden">
            {/* Module header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{module.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {completedInModule}/{module.lessons.length} lessons
                </p>
              </div>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-2" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-2" />
              )}
            </button>

            {/* Lessons list */}
            {isOpen && (
              <ul className="divide-y divide-gray-50">
                {module.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLessonId
                  const isCompleted = completedLessonIds.includes(lesson.id)
                  const locked = isLocked(lesson)

                  return (
                    <li key={lesson.id}>
                      <button
                        disabled={locked}
                        onClick={() => !locked && handleLessonClick(lesson.id)}
                        className={[
                          'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                          isCurrent
                            ? 'bg-primary/5 text-primary'
                            : locked
                              ? 'opacity-50 cursor-not-allowed text-gray-400'
                              : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900',
                        ].join(' ')}
                      >
                        {/* Status icon */}
                        <span className="shrink-0 w-4 flex items-center justify-center">
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : isCurrent ? (
                            <ArrowRight className="h-3.5 w-3.5 text-primary" />
                          ) : locked ? (
                            <Lock className="h-3.5 w-3.5 text-gray-300" />
                          ) : null}
                        </span>

                        {/* Lesson type icon + title */}
                        <LessonIcon type={lesson.type} />
                        <span className="flex-1 text-xs leading-snug truncate">{lesson.title}</span>

                        {/* Duration */}
                        {lesson.durationS != null && (
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                            {Math.ceil(lesson.durationS / 60)}m
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

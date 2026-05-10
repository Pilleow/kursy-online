'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LessonList } from './LessonList'
import type { ContentStatus, Module } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleWithCount = Module & { _count?: { lessons: number } }

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: 'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending_review:
    'border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  published:
    'border-transparent bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Draft',
  pending_review: 'In review',
  published: 'Published',
}

// ─── ModuleRow ────────────────────────────────────────────────────────────────

type ModuleRowProps = {
  module: ModuleWithCount
}

export function ModuleRow({ module }: ModuleRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const lessonCount = module._count?.lessons ?? 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          aria-label="Drag module"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <button
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse module' : 'Expand module'}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
          {module.title}
        </span>

        <span className="text-xs text-gray-400 dark:text-gray-500">
          {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
        </span>

        <Badge className={STATUS_COLORS[module.status]}>{STATUS_LABELS[module.status]}</Badge>
      </div>

      {/* Expanded lessons */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 dark:border-gray-800">
          <LessonList moduleId={module.id} />
        </div>
      )}
    </div>
  )
}

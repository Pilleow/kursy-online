'use client'

import { Move, Copy, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type BulkAction = 'move' | 'duplicate' | 'delete'

type BulkActionBarProps = {
  selectedIds: string[]
  onAction: (action: BulkAction, ids: string[]) => void
  onClear?: () => void
  entityLabel?: string
}

export function BulkActionBar({
  selectedIds,
  onAction,
  onClear,
  entityLabel = 'item',
}: BulkActionBarProps) {
  if (selectedIds.length === 0) return null

  const label = selectedIds.length === 1 ? `1 ${entityLabel}` : `${selectedIds.length} ${entityLabel}s`

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white shadow-xl px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
          {label} selected
        </span>

        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('move', selectedIds)}
          className="h-7 gap-1.5 px-2.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
        >
          <Move className="h-3.5 w-3.5" />
          Move
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('duplicate', selectedIds)}
          className="h-7 gap-1.5 px-2.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('delete', selectedIds)}
          className="h-7 gap-1.5 px-2.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>

        {onClear && (
          <>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

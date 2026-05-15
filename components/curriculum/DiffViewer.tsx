'use client'

import type { Block, TextBlock, VideoBlock, QuizBlock, HomeworkBlock } from '@/lib/types/lesson'
import { cn } from '@/lib/utils'

type DiffState = 'unchanged' | 'changed' | 'added' | 'removed'

type DiffRow = {
  id: string
  state: DiffState
  oldBlock: Block | null
  newBlock: Block | null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'text': {
      const text = stripHtml((block as TextBlock).html)
      return text.length > 120 ? text.slice(0, 120) + '…' : text
    }
    case 'video': {
      const b = block as VideoBlock
      return b.caption ? `${b.caption} — ${b.url}` : b.url
    }
    case 'quiz':
      return `Quiz block (id: ${(block as QuizBlock).quizId})`
    case 'homework':
      return `Homework block (id: ${(block as HomeworkBlock).homeworkId})`
    case 'qa_section':
      return block.prompt ? `Q&A: ${block.prompt}` : 'Q&A section'
    default:
      return JSON.stringify(block)
  }
}

function blockTypeLabel(block: Block): string {
  const labels: Record<string, string> = {
    text: 'Text',
    video: 'Video',
    quiz: 'Quiz',
    homework: 'Homework',
    qa_section: 'Q&A',
  }
  return labels[block.type] ?? block.type
}

function buildDiff(oldBlocks: Block[], newBlocks: Block[]): DiffRow[] {
  const newById = new Map(newBlocks.map((b) => [b.id, b]))

  const seen = new Set<string>()
  const rows: DiffRow[] = []

  for (const oldBlock of oldBlocks) {
    seen.add(oldBlock.id)
    const newBlock = newById.get(oldBlock.id) ?? null

    let state: DiffState
    if (!newBlock) {
      state = 'removed'
    } else if (JSON.stringify(oldBlock) === JSON.stringify(newBlock)) {
      state = 'unchanged'
    } else {
      state = 'changed'
    }

    rows.push({ id: oldBlock.id, state, oldBlock, newBlock })
  }

  for (const newBlock of newBlocks) {
    if (!seen.has(newBlock.id)) {
      rows.push({ id: newBlock.id, state: 'added', oldBlock: null, newBlock })
    }
  }

  return rows
}

type CellProps = {
  block: Block | null
  side: 'old' | 'new'
  state: DiffState
}

function BlockCell({ block, side, state }: CellProps) {
  const isEmpty = block === null
  const highlight =
    (side === 'old' && state === 'removed') ||
    (side === 'new' && (state === 'added' || state === 'changed'))

  return (
    <div
      className={cn(
        'flex-1 min-w-0 px-3 py-2 text-sm font-mono',
        isEmpty && 'bg-gray-50 dark:bg-gray-800/40',
        highlight && side === 'old' && 'bg-red-50 dark:bg-red-950/30',
        highlight && side === 'new' && 'bg-green-50 dark:bg-green-950/30',
        !highlight && !isEmpty && 'bg-white dark:bg-gray-900',
      )}
    >
      {block ? (
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wide',
              side === 'old' && state === 'removed' && 'text-red-500',
              side === 'new' && state === 'added' && 'text-green-600',
              side === 'new' && state === 'changed' && 'text-amber-600',
              state === 'unchanged' && 'text-gray-400',
            )}
          >
            {blockTypeLabel(block)}
          </span>
          <span className="text-gray-700 dark:text-gray-300 break-words">{renderBlock(block)}</span>
        </div>
      ) : null}
    </div>
  )
}

type Props = {
  oldBlocks: Block[]
  newBlocks: Block[]
}

export function DiffViewer({ oldBlocks, newBlocks }: Props) {
  const rows = buildDiff(oldBlocks, newBlocks)

  if (rows.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-gray-400 text-center">No block changes to display.</p>
    )
  }

  const changedCount = rows.filter((r) => r.state !== 'unchanged').length

  return (
    <div className="rounded-md border border-gray-100 dark:border-gray-800 overflow-hidden text-xs">
      {/* Header */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
        <div className="flex-1 px-3 py-1.5 font-semibold text-gray-500 uppercase tracking-wide">
          Current (published)
        </div>
        <div className="w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 px-3 py-1.5 font-semibold text-gray-500 uppercase tracking-wide">
          Proposed changes{' '}
          {changedCount > 0 && (
            <span className="ml-1 text-amber-600 font-normal">
              ({changedCount} change{changedCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={cn(
            'flex',
            i > 0 && 'border-t border-gray-100 dark:border-gray-800',
          )}
        >
          <BlockCell block={row.oldBlock} side="old" state={row.state} />
          <div className="w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
          <BlockCell block={row.newBlock} side="new" state={row.state} />
        </div>
      ))}
    </div>
  )
}

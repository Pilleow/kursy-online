'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  Type,
  Video,
  HelpCircle,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'
import type { Editor, Range } from '@tiptap/core'
import { cn } from '@/lib/utils'

type CommandItem = {
  label: string
  description: string
  icon: React.ElementType
  command: (args: { editor: Editor; range: Range }) => void
}

const ALL_ITEMS: CommandItem[] = [
  {
    label: 'Text',
    description: 'Plain paragraph',
    icon: Type,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    label: 'Video',
    description: 'Embed a video block',
    icon: Video,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: 'paragraph', content: [{ type: 'text', text: '📹 Video block (coming soon)' }] })
        .run()
    },
  },
  {
    label: 'Quiz',
    description: 'Add a quiz block',
    icon: HelpCircle,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: 'paragraph', content: [{ type: 'text', text: '❓ Quiz block (coming soon)' }] })
        .run()
    },
  },
  {
    label: 'Homework',
    description: 'Add a homework assignment',
    icon: ClipboardList,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: 'paragraph', content: [{ type: 'text', text: '📝 Homework block (coming soon)' }] })
        .run()
    },
  },
  {
    label: 'Q&A Section',
    description: 'Student discussion area',
    icon: MessageSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: 'qaSection' }).run()
    },
  },
]

export type CommandMenuListRef = {
  onKeyDown: (event: KeyboardEvent) => boolean
}

type Props = {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export const CommandMenuList = forwardRef<CommandMenuListRef, Props>(
  function CommandMenuList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    return (
      <div className="z-50 max-h-60 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              ref={(el) => { itemRefs.current[index] = el }}
              type="button"
              onClick={() => command(item)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                index === selectedIndex
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/60',
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
              <div className="min-w-0">
                <div className="font-medium leading-tight">{item.label}</div>
                <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                  {item.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  },
)

// ─── Suggestion config ─────────────────────────────────────────────────────────

import { ReactRenderer } from '@tiptap/react'

export function buildSuggestion() {
  return {
    items: ({ query }: { query: string }) => {
      const q = query.toLowerCase()
      return q
        ? ALL_ITEMS.filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q),
          )
        : ALL_ITEMS
    },

    render: () => {
      let renderer: ReactRenderer<CommandMenuListRef, Props>
      let floatingEl: HTMLDivElement

      return {
        onStart(props: { items: CommandItem[]; command: (item: CommandItem) => void; clientRect?: (() => DOMRect | null) | null }) {
          floatingEl = document.createElement('div')
          floatingEl.style.cssText =
            'position:fixed;z-index:9999;pointer-events:auto'
          document.body.appendChild(floatingEl)

          renderer = new ReactRenderer(CommandMenuList, {
            props: { items: props.items, command: props.command },
            editor: (props as any).editor,
          })
          floatingEl.appendChild(renderer.element)

          const rect = props.clientRect?.()
          if (rect) {
            floatingEl.style.left = `${rect.left}px`
            floatingEl.style.top = `${rect.bottom + 4}px`
          }
        },

        onUpdate(props: { items: CommandItem[]; command: (item: CommandItem) => void; clientRect?: (() => DOMRect | null) | null }) {
          renderer.updateProps({ items: props.items, command: props.command })
          const rect = props.clientRect?.()
          if (rect && floatingEl) {
            floatingEl.style.left = `${rect.left}px`
            floatingEl.style.top = `${rect.bottom + 4}px`
          }
        },

        onKeyDown({ event }: { event: KeyboardEvent }) {
          if (event.key === 'Escape') {
            floatingEl.style.display = 'none'
            return true
          }
          return renderer.ref?.onKeyDown(event) ?? false
        },

        onExit() {
          floatingEl.remove()
          renderer.destroy()
        },
      }
    },
  }
}

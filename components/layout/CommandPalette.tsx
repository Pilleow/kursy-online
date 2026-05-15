'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  Globe,
  Settings,
  Plus,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Action = {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  href?: string
  callback?: () => void
  shortcut?: string
}

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const actions: Action[] = [
    {
      id: 'new-course',
      label: 'New Course',
      description: 'Create a new course',
      icon: Plus,
      href: '/admin/courses?new=1',
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'Overview and key metrics',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
      shortcut: '↑1',
    },
    {
      id: 'courses',
      label: 'Go to Courses',
      description: 'Manage all courses',
      icon: BookOpen,
      href: '/admin/courses',
    },
    {
      id: 'qa',
      label: 'Go to Q&A',
      description: 'Review student questions',
      icon: MessageSquare,
      href: '/admin/courses',
    },
    {
      id: 'students',
      label: 'Go to Students',
      description: 'View and manage students',
      icon: GraduationCap,
      href: '/admin/students',
    },
    {
      id: 'instructors',
      label: 'Go to Instructors',
      description: 'Manage instructor team',
      icon: Users,
      href: '/admin/instructors',
    },
    {
      id: 'enrollments',
      label: 'Go to Enrollments',
      description: 'Track course enrollments',
      icon: ClipboardList,
      href: '/admin/enrollments',
    },
    {
      id: 'translations',
      label: 'Go to Translations',
      description: 'Manage UI translations',
      icon: Globe,
      href: '/admin/translations',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      description: 'School and account settings',
      icon: Settings,
      href: '/admin/settings',
    },
  ]

  const filtered = query.trim()
    ? actions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : actions

  const runAction = useCallback(
    (action: Action) => {
      onOpenChange(false)
      if (action.href) {
        router.push(action.href)
      } else {
        action.callback?.()
      }
    },
    [onOpenChange, router],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const action = filtered[activeIndex]
        if (action) runAction(action)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, filtered, activeIndex, runAction])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>

        <div className="border-b border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center gap-2">
          <span className="text-gray-400">⌘</span>
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-gray-400"
          />
          <kbd className="shrink-0 text-[10px] text-gray-300 font-mono border border-gray-100 rounded px-1 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No results for &quot;{query}&quot;</p>
          ) : (
            filtered.map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => runAction(action)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                    i === activeIndex
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                    <Icon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {action.label}
                    </p>
                    {action.description && (
                      <p className="text-xs text-gray-400 truncate">{action.description}</p>
                    )}
                  </div>
                  {action.shortcut && (
                    <span className="shrink-0 text-xs text-gray-300 font-mono">
                      {action.shortcut}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-1.5 flex items-center gap-3 text-[10px] text-gray-300">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

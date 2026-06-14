'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, BookOpen, HelpCircle, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLessons, useCreateLesson, useReorderLessons, useLesson } from '@/lib/hooks/useLesson'
import { updateLesson as apiUpdateLesson } from '@/lib/api/lessons'
import { CreateLessonSchema, type CreateLessonInput } from '@/lib/schemas/lesson'
import { useToast } from '@/hooks/use-toast'
import { BlockEditor } from '@/components/editor/BlockEditor'
import { cn } from '@/lib/utils'
import type { Lesson, ContentStatus, LessonType } from '@/lib/types'

// ─── Status / type helpers ────────────────────────────────────────────────────

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

const TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  content: <BookOpen className="h-3 w-3" />,
  quiz: <HelpCircle className="h-3 w-3" />,
  homework: <ClipboardList className="h-3 w-3" />,
}

// ─── Inline-editable lesson row ───────────────────────────────────────────────

function SortableLessonRow({
  lesson,
  isSelected,
  onSelect,
  onTitleSave,
}: {
  lesson: Lesson
  isSelected: boolean
  onSelect: () => void
  onTitleSave: (title: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(lesson.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const commitEdit = async () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== lesson.title) {
      await onTitleSave(trimmed)
    } else {
      setTitleValue(lesson.title)
    }
    setEditing(false)
  }

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={!editing ? onSelect : undefined}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 transition-colors',
        isSelected
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/70',
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        aria-label="Drag lesson"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Title or inline editor */}
      {editing ? (
        <Input
          ref={inputRef}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
            if (e.key === 'Escape') { setTitleValue(lesson.title); setEditing(false) }
          }}
          className="h-6 flex-1 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
        />
      ) : (
        <span
          className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300"
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          title="Double-click to rename"
        >
          {lesson.title}
        </span>
      )}

      <Badge
        variant="outline"
        className="shrink-0 gap-1 border-transparent bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      >
        {TYPE_ICONS[lesson.type]}
      </Badge>
      <Badge className={cn('shrink-0 text-xs', STATUS_COLORS[lesson.status])}>
        {STATUS_LABELS[lesson.status]}
      </Badge>
    </div>
  )
}

// ─── Add lesson dialog ─────────────────────────────────────────────────────────

function AddLessonDialog({ moduleId, onClose }: { moduleId: string; onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateLesson()
  const form = useForm<CreateLessonInput>({
    resolver: zodResolver(CreateLessonSchema),
    defaultValues: { title: '', type: 'content' },
  })

  const onSubmit = async (values: CreateLessonInput) => {
    await mutateAsync({ moduleId, body: values })
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add lesson</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Introduction to Variables" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="homework">Homework</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Adding…' : 'Add lesson'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Editor panel ─────────────────────────────────────────────────────────────

function EditorPanel({ lessonId }: { lessonId: string }) {
  const { data: lesson, isLoading } = useLesson(lessonId)

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Lesson not found.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-3 dark:border-gray-800">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-50">{lesson.title}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <BlockEditor
          key={lessonId}
          lessonId={lessonId}
          initialBlocks={lesson.blocks ?? []}
          lessonStatus={lesson.status}
        />
      </div>
    </div>
  )
}

// ─── ModuleEditorClient ───────────────────────────────────────────────────────

type Props = {
  courseId: string
  moduleId: string
  selectedLessonId?: string
}

export function ModuleEditorClient({ moduleId, selectedLessonId }: Props) {
  const { data, isLoading } = useLessons(moduleId)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const { mutateAsync: reorder } = useReorderLessons()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (data) setLessons(data)
  }, [data])

  const selectLesson = useCallback(
    (id: string) => {
      router.push(`${pathname}?lesson=${id}`, { scroll: false })
    },
    [router, pathname],
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = lessons.findIndex((l) => l.id === active.id)
    const newIndex = lessons.findIndex((l) => l.id === over.id)
    const prev = lessons
    const reordered = arrayMove(lessons, oldIndex, newIndex)
    setLessons(reordered)

    try {
      await reorder({ moduleId, ids: reordered.map((l) => l.id) })
    } catch {
      setLessons(prev)
      toast({ title: 'Reorder failed', description: 'Could not save lesson order.', variant: 'destructive' })
    }
  }

  const handleTitleSave = async (lessonId: string, title: string) => {
    const prev = lessons
    setLessons((ls) => ls.map((l) => (l.id === lessonId ? { ...l, title } : l)))
    try {
      await apiUpdateLesson(lessonId, { title })
    } catch {
      setLessons(prev)
      toast({ title: 'Rename failed', variant: 'destructive' })
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">
      {/* ── Left: lesson list ── */}
      <div className="flex w-96 shrink-0 flex-col border-r border-gray-100 dark:border-gray-800">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Lessons</h2>
          <p className="mt-0.5 text-xs text-gray-400">Drag to reorder · double-click to rename</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {lessons.map((lesson) => (
                    <SortableLessonRow
                      key={lesson.id}
                      lesson={lesson}
                      isSelected={lesson.id === selectedLessonId}
                      onSelect={() => selectLesson(lesson.id)}
                      onTitleSave={(title) => handleTitleSave(lesson.id, title)}
                    />
                  ))}
                  {lessons.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">No lessons yet.</p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full gap-1.5 px-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lesson
          </Button>
        </div>
      </div>

      {/* ── Right: editor ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedLessonId ? (
          <EditorPanel lessonId={selectedLessonId} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Select a lesson to start editing
          </div>
        )}
      </div>

      {addOpen && <AddLessonDialog moduleId={moduleId} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

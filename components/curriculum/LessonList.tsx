'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLessons, useCreateLesson, useReorderLessons } from '@/lib/hooks/useLesson'
import { CreateLessonSchema, type CreateLessonInput } from '@/lib/schemas/lesson'
import { useToast } from '@/hooks/use-toast'
import type { Lesson, ContentStatus, LessonType } from '@/lib/types'

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

const LESSON_TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  content: <BookOpen className="h-3 w-3" />,
  quiz: <HelpCircle className="h-3 w-3" />,
  homework: <ClipboardList className="h-3 w-3" />,
}

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  content: 'Content',
  quiz: 'Quiz',
  homework: 'Homework',
}

// ─── Sortable lesson row ───────────────────────────────────────────────────────

function SortableLessonRow({ lesson }: { lesson: Lesson }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        aria-label="Drag lesson"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
        {lesson.title}
      </span>

      <Badge
        variant="outline"
        className="gap-1 border-transparent bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      >
        {LESSON_TYPE_ICONS[lesson.type]}
        {LESSON_TYPE_LABELS[lesson.type]}
      </Badge>

      <Badge className={STATUS_COLORS[lesson.status]}>{STATUS_LABELS[lesson.status]}</Badge>
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
        <DialogHeader>
          <DialogTitle>Add lesson</DialogTitle>
        </DialogHeader>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding…' : 'Add lesson'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── LessonList ───────────────────────────────────────────────────────────────

type LessonListProps = {
  moduleId: string
}

export function LessonList({ moduleId }: LessonListProps) {
  const { data, isLoading } = useLessons(moduleId)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const { mutateAsync: reorder } = useReorderLessons()
  const { toast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (data) setLessons(data)
  }, [data])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = lessons.findIndex((l) => l.id === active.id)
    const newIndex = lessons.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(lessons, oldIndex, newIndex)

    setLessons(reordered)

    try {
      await reorder({ moduleId, ids: reordered.map((l) => l.id) })
    } catch {
      setLessons(lessons)
      toast({ title: 'Reorder failed', description: 'Could not save lesson order.', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-1.5 py-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1.5 py-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson) => (
            <SortableLessonRow key={lesson.id} lesson={lesson} />
          ))}
        </SortableContext>
      </DndContext>

      {lessons.length === 0 && (
        <p className="py-2 text-center text-xs text-gray-400">No lessons yet.</p>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="mt-1 h-7 gap-1.5 px-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Lesson
      </Button>

      {addOpen && <AddLessonDialog moduleId={moduleId} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

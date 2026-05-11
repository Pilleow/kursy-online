'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
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
import {
  updateLesson as apiUpdateLesson,
  deleteLesson as apiDeleteLesson,
  createLesson as apiCreateLesson,
} from '@/lib/api/lessons'
import { CreateLessonSchema, type CreateLessonInput } from '@/lib/schemas/lesson'
import { useToast } from '@/hooks/use-toast'
import { BulkActionBar, type BulkAction } from '@/components/layout/BulkActionBar'
import { cn } from '@/lib/utils'
import type { Lesson, ContentStatus, LessonType } from '@/lib/types'

// ─── Status / type maps ────────────────────────────────────────────────────────

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

function SortableLessonRow({
  lesson,
  isSelected,
  onRowClick,
}: {
  lesson: Lesson
  isSelected: boolean
  onRowClick: (e: React.MouseEvent) => void
}) {
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
      onClick={onRowClick}
      onMouseDown={(e) => { if (e.shiftKey) e.preventDefault() }}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors',
        isSelected
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/70',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
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

// ─── Move to module dialog ─────────────────────────────────────────────────────

function MoveToModuleDialog({
  modules,
  loading,
  onMove,
  onClose,
}: {
  modules: { id: string; title: string }[]
  loading: boolean
  onMove: (moduleId: string) => void
  onClose: () => void
}) {
  const [targetId, setTargetId] = useState('')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Move to Module</DialogTitle>
        </DialogHeader>
        <Select onValueChange={setTargetId} value={targetId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button disabled={!targetId || loading} onClick={() => targetId && onMove(targetId)}>
            {loading ? 'Moving…' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteConfirmDialog({
  count,
  loading,
  onConfirm,
  onClose,
}: {
  count: number
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Delete {count} {count === 1 ? 'lesson' : 'lessons'}?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={loading} onClick={onConfirm}>
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── LessonList ───────────────────────────────────────────────────────────────

type LessonListProps = {
  moduleId: string
  courseId: string
  otherModules: { id: string; title: string }[]
}

export function LessonList({ moduleId, courseId, otherModules }: LessonListProps) {
  const { data, isLoading } = useLessons(moduleId)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([])
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const lastClickedIndex = useRef<number | null>(null)
  const { mutateAsync: reorder } = useReorderLessons()
  const { toast } = useToast()
  const router = useRouter()
  const qc = useQueryClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (data) setLessons(data)
  }, [data])

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
      toast({
        title: 'Reorder failed',
        description: 'Could not save lesson order.',
        variant: 'destructive',
      })
    }
  }

  const handleLessonClick = useCallback(
    (lesson: Lesson, index: number, e: React.MouseEvent) => {
      if (e.shiftKey) {
        e.preventDefault()
        if (lastClickedIndex.current === null) {
          lastClickedIndex.current = index
          setSelectedLessonIds([lesson.id])
        } else {
          const start = Math.min(lastClickedIndex.current, index)
          const end = Math.max(lastClickedIndex.current, index)
          setSelectedLessonIds(lessons.slice(start, end + 1).map((l) => l.id))
        }
      } else {
        lastClickedIndex.current = index
        router.push(
          `/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`,
        )
      }
    },
    [lessons, courseId, moduleId, router],
  )

  const handleBulkAction = async (action: BulkAction, ids: string[]) => {
    if (action === 'move') {
      setMoveDialogOpen(true)
      return
    }

    if (action === 'duplicate') {
      setBulkLoading(true)
      try {
        const targets = lessons.filter((l) => ids.includes(l.id))
        await Promise.all(
          targets.map((l) =>
            apiCreateLesson(moduleId, { title: `${l.title} (copy)`, type: l.type }),
          ),
        )
        setSelectedLessonIds([])
        qc.invalidateQueries({ queryKey: ['modules', moduleId, 'lessons'] })
      } catch {
        toast({ title: 'Duplicate failed', description: 'Could not duplicate lessons.', variant: 'destructive' })
      } finally {
        setBulkLoading(false)
      }
      return
    }

    if (action === 'delete') {
      setDeleteConfirmOpen(true)
    }
  }

  const handleMove = async (targetModuleId: string) => {
    setBulkLoading(true)
    try {
      await Promise.all(
        selectedLessonIds.map((id) => apiUpdateLesson(id, { moduleId: targetModuleId })),
      )
      setSelectedLessonIds([])
      setMoveDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['modules'] })
    } catch {
      toast({ title: 'Move failed', description: 'Could not move lessons.', variant: 'destructive' })
    } finally {
      setBulkLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setBulkLoading(true)
    try {
      await Promise.all(selectedLessonIds.map((id) => apiDeleteLesson(id)))
      setSelectedLessonIds([])
      setDeleteConfirmOpen(false)
      qc.invalidateQueries({ queryKey: ['modules', moduleId, 'lessons'] })
    } catch {
      toast({ title: 'Delete failed', description: 'Could not delete lessons.', variant: 'destructive' })
    } finally {
      setBulkLoading(false)
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
    <>
      <div className="space-y-1.5 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {lessons.map((lesson, index) => (
              <SortableLessonRow
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedLessonIds.includes(lesson.id)}
                onRowClick={(e) => handleLessonClick(lesson, index, e)}
              />
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
      </div>

      {addOpen && <AddLessonDialog moduleId={moduleId} onClose={() => setAddOpen(false)} />}

      {moveDialogOpen && (
        <MoveToModuleDialog
          modules={otherModules}
          loading={bulkLoading}
          onMove={handleMove}
          onClose={() => setMoveDialogOpen(false)}
        />
      )}

      {deleteConfirmOpen && (
        <DeleteConfirmDialog
          count={selectedLessonIds.length}
          loading={bulkLoading}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteConfirmOpen(false)}
        />
      )}

      <BulkActionBar
        selectedIds={selectedLessonIds}
        onAction={(action, ids) => handleBulkAction(action, ids)}
        onClear={() => setSelectedLessonIds([])}
        entityLabel="lesson"
      />
    </>
  )
}

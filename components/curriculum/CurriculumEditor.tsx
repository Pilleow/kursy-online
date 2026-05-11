'use client'

import { useState, useEffect, useCallback } from 'react'
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
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus, Undo2, Redo2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCourseModules, useCreateModule, useReorderModules, useUpdateModule } from '@/lib/hooks/useCourses'
import { CreateModuleSchema, type CreateModuleInput } from '@/lib/schemas/module'
import { useToast } from '@/hooks/use-toast'
import {
  useEditorStore,
  useCanUndoCurriculum,
  useCanRedoCurriculum,
} from '@/lib/store/editorStore'
import { ModuleRow, type ModuleWithCount } from './ModuleRow'

// ─── Add module dialog ─────────────────────────────────────────────────────────

function AddModuleDialog({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateModule()
  const form = useForm<CreateModuleInput>({
    resolver: zodResolver(CreateModuleSchema),
    defaultValues: { title: '' },
  })

  const onSubmit = async (values: CreateModuleInput) => {
    await mutateAsync({ courseId, title: values.title })
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add module</DialogTitle>
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
                    <Input placeholder="e.g. Getting Started" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding…' : 'Add module'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── CurriculumEditor ──────────────────────────────────────────────────────────

type CurriculumEditorProps = {
  courseId: string
}

export function CurriculumEditor({ courseId }: CurriculumEditorProps) {
  const { data, isLoading } = useCourseModules(courseId)
  const [modules, setModules] = useState<ModuleWithCount[]>([])
  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const { mutateAsync: reorder } = useReorderModules()
  const { mutateAsync: patchModule } = useUpdateModule()
  const { toast } = useToast()

  const {
    initCurriculumModules,
    pushCurriculumModules,
    undoCurriculum,
    redoCurriculum,
  } = useEditorStore()
  const canUndo = useCanUndoCurriculum()
  const canRedo = useCanRedoCurriculum()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Sync server data into local state and initialise history reference
  useEffect(() => {
    if (data) {
      const typed = data as ModuleWithCount[]
      setModules(typed)
      initCurriculumModules(typed.map((m) => ({ id: m.id, title: m.title })))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Apply a restored entry set: update local state and fire PATCHes
  const applyRestore = useCallback(
    async (entries: { id: string; title: string }[]) => {
      // Rebuild module array in restored order with restored titles
      const restored: ModuleWithCount[] = entries
        .map((e) => {
          const m = modules.find((mod) => mod.id === e.id)
          return m ? { ...m, title: e.title } : null
        })
        .filter((m): m is ModuleWithCount => m !== null)

      setModules(restored)

      // Reorder if order changed
      const orderChanged = entries.some((e, i) => modules[i]?.id !== e.id)
      if (orderChanged) {
        try {
          await reorder({ courseId, ids: entries.map((e) => e.id) })
        } catch {
          toast({ title: 'Undo failed', description: 'Could not restore module order.', variant: 'destructive' })
        }
      }

      // Patch any titles that changed
      for (const entry of entries) {
        const current = modules.find((m) => m.id === entry.id)
        if (current && current.title !== entry.title) {
          try {
            await patchModule({ id: entry.id, body: { title: entry.title } })
          } catch {
            toast({ title: 'Undo failed', description: 'Could not restore module title.', variant: 'destructive' })
          }
        }
      }
    },
    [modules, courseId, reorder, patchModule, toast],
  )

  // Keyboard shortcuts — skip when focus is inside an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey || e.key !== 'z') return
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      e.preventDefault()

      if (e.shiftKey) {
        redoCurriculum()
        const entries = useEditorStore.getState().curriculumModules
        applyRestore(entries)
      } else {
        undoCurriculum()
        const entries = useEditorStore.getState().curriculumModules
        applyRestore(entries)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undoCurriculum, redoCurriculum, applyRestore])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex((m) => m.id === active.id)
    const newIndex = modules.findIndex((m) => m.id === over.id)
    const prev = modules
    const reordered = arrayMove(modules, oldIndex, newIndex)

    // Push old state to history before applying new state
    pushCurriculumModules(reordered.map((m) => ({ id: m.id, title: m.title })))
    setModules(reordered)

    try {
      await reorder({ courseId, ids: reordered.map((m) => m.id) })
    } catch {
      initCurriculumModules(prev.map((m) => ({ id: m.id, title: m.title })))
      setModules(prev)
      toast({
        title: 'Reorder failed',
        description: 'Could not save module order.',
        variant: 'destructive',
      })
    }
  }

  const handleModuleTitleChange = async (moduleId: string, newTitle: string) => {
    const prev = modules
    const updated = modules.map((m) => (m.id === moduleId ? { ...m, title: newTitle } : m))

    pushCurriculumModules(updated.map((m) => ({ id: m.id, title: m.title })))
    setModules(updated)

    try {
      await patchModule({ id: moduleId, body: { title: newTitle } })
    } catch {
      initCurriculumModules(prev.map((m) => ({ id: m.id, title: m.title })))
      setModules(prev)
      toast({
        title: 'Update failed',
        description: 'Could not save module title.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Undo / Redo toolbar */}
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo}
          onClick={() => {
            undoCurriculum()
            applyRestore(useEditorStore.getState().curriculumModules)
          }}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canRedo}
          onClick={() => {
            redoCurriculum()
            applyRestore(useEditorStore.getState().curriculumModules)
          }}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {modules.map((module) => (
            <ModuleRow
              key={module.id}
              module={module}
              onTitleChange={handleModuleTitleChange}
              courseId={courseId}
              otherModules={modules
                .filter((m) => m.id !== module.id)
                .map((m) => ({ id: m.id, title: m.title }))}
            />
          ))}
        </SortableContext>
      </DndContext>

      {modules.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
          No modules yet. Add your first module below.
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setAddModuleOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Module
      </Button>

      {addModuleOpen && (
        <AddModuleDialog courseId={courseId} onClose={() => setAddModuleOpen(false)} />
      )}
    </div>
  )
}

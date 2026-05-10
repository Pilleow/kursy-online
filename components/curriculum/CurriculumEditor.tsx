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
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
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
import { useCourseModules, useCreateModule, useReorderModules } from '@/lib/hooks/useCourses'
import { CreateModuleSchema, type CreateModuleInput } from '@/lib/schemas/module'
import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (data) setModules(data as ModuleWithCount[])
  }, [data])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex((m) => m.id === active.id)
    const newIndex = modules.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(modules, oldIndex, newIndex)

    setModules(reordered)

    try {
      await reorder({ courseId, ids: reordered.map((m) => m.id) })
    } catch {
      setModules(modules)
      toast({
        title: 'Reorder failed',
        description: 'Could not save module order.',
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {modules.map((module) => (
            <ModuleRow key={module.id} module={module} />
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

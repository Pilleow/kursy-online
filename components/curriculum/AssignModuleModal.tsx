'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllCoursesWithModules, useReplaceModuleInstructors } from '@/lib/hooks/useSchoolInstructors'
import { useToast } from '@/hooks/use-toast'
import type { SchoolInstructor } from '@/lib/api/school'

// ─── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  instructor: SchoolInstructor | null
  allInstructors: SchoolInstructor[]
  onClose: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AssignModuleModal({ instructor, allInstructors, onClose }: Props) {
  const { data: courses, isLoading } = useAllCoursesWithModules()
  const replaceInstructors = useReplaceModuleInstructors()
  const { toast } = useToast()

  // Set of moduleIds currently checked (what the user sees in the UI)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // Build module -> instructor IDs map from all instructors data (avoids extra API calls)
  const moduleInstructorMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    allInstructors.forEach((inst) => {
      inst.user.moduleAssignments.forEach(({ moduleId }) => {
        if (!map.has(moduleId)) map.set(moduleId, new Set())
        map.get(moduleId)!.add(inst.userId)
      })
    })
    return map
  }, [allInstructors])

  // Reset checked state whenever the modal opens for a different instructor
  useEffect(() => {
    if (!instructor) return
    const currentModuleIds = new Set(
      instructor.user.moduleAssignments.map((a) => a.moduleId),
    )
    setChecked(currentModuleIds)
  }, [instructor])

  const toggle = (moduleId: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleSave = async () => {
    if (!instructor) return

    const initial = new Set(instructor.user.moduleAssignments.map((a) => a.moduleId))

    // Determine which modules changed
    const toAdd = Array.from(checked).filter((id) => !initial.has(id))
    const toRemove = Array.from(initial).filter((id) => !checked.has(id))
    const changed = [...toAdd, ...toRemove]

    if (changed.length === 0) {
      onClose()
      return
    }

    try {
      await Promise.all(
        changed.map((moduleId) => {
          const existing = moduleInstructorMap.get(moduleId) ?? new Set<string>()
          let next: string[]
          if (checked.has(moduleId)) {
            // Adding this instructor
            next = [...Array.from(existing), instructor.userId]
          } else {
            // Removing this instructor
            next = Array.from(existing).filter((id) => id !== instructor.userId)
          }
          return replaceInstructors.mutateAsync({ moduleId, instructorIds: next })
        }),
      )
      toast({
        title: 'Modules updated',
        description: `${instructor.user.firstName}'s module assignments have been saved.`,
      })
      onClose()
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    }
  }

  const totalModules = courses?.reduce((sum, c) => sum + c.modules.length, 0) ?? 0

  return (
    <Dialog open={!!instructor} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign modules
            {instructor && (
              <span className="ml-1.5 font-normal text-gray-500">
                — {instructor.user.firstName} {instructor.user.lastName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : !courses || totalModules === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No modules found. Create a course with modules first.
            </p>
          ) : (
            courses.map((course) => {
              if (course.modules.length === 0) return null
              return (
                <div key={course.id}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {course.title}
                  </p>
                  <div className="space-y-1.5 pl-1">
                    {course.modules.map((mod) => (
                      <label
                        key={mod.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Checkbox
                          checked={checked.has(mod.id)}
                          onCheckedChange={() => toggle(mod.id)}
                          id={`mod-${mod.id}`}
                        />
                        <span className="text-gray-800 dark:text-gray-200">{mod.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={replaceInstructors.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || replaceInstructors.isPending}>
            {replaceInstructors.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

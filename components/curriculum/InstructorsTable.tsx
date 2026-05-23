'use client'

import { useState } from 'react'
import { BookOpen, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AssignModuleModal } from './AssignModuleModal'
import { useRemoveInstructor } from '@/lib/hooks/useSchoolInstructors'
import { useToast } from '@/hooks/use-toast'
import type { SchoolInstructor } from '@/lib/api/school'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Remove confirm dialog ────────────────────────────────────────────────────

function RemoveDialog({
  instructor,
  onDone,
}: {
  instructor: SchoolInstructor | null
  onDone: () => void
}) {
  const remove = useRemoveInstructor()
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!instructor) return
    try {
      await remove.mutateAsync(instructor.userId)
      toast({
        title: 'Instructor removed',
        description: `${instructor.user.firstName} ${instructor.user.lastName} has been removed from the school.`,
      })
      onDone()
    } catch {
      toast({ title: 'Failed to remove instructor', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!instructor} onOpenChange={(open) => { if (!open) onDone() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove instructor</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remove{' '}
          <span className="font-medium">
            {instructor?.user.firstName} {instructor?.user.lastName}
          </span>{' '}
          from the school? They will lose access to all assigned modules.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={handleConfirm}>
            {remove.isPending ? 'Removing…' : 'Remove instructor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {[140, 180, 80, 60].map((w, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4" style={{ width: w }} />
            </TableCell>
          ))}
          <TableCell>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function InstructorsTable({
  instructors,
  isLoading,
}: {
  instructors: SchoolInstructor[] | undefined
  isLoading: boolean
}) {
  const [assignTarget, setAssignTarget] = useState<SchoolInstructor | null>(null)
  const [removeTarget, setRemoveTarget] = useState<SchoolInstructor | null>(null)

  return (
    <>
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : !instructors || instructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-gray-400">
                  No instructors yet. Invite someone to get started.
                </TableCell>
              </TableRow>
            ) : (
              instructors.map((inst) => (
                <TableRow key={inst.userId}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                    {inst.user.firstName} {inst.user.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{inst.user.email}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(inst.createdAt)}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {inst.user.moduleAssignments.length}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Assign modules"
                        onClick={() => setAssignTarget(inst)}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        title="Remove instructor"
                        onClick={() => setRemoveTarget(inst)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssignModuleModal
        instructor={assignTarget}
        allInstructors={instructors ?? []}
        onClose={() => setAssignTarget(null)}
      />

      <RemoveDialog instructor={removeTarget} onDone={() => setRemoveTarget(null)} />
    </>
  )
}

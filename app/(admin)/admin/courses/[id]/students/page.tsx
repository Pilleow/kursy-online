'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Progress } from '@/components/ui/progress'
import { useCourseStudents, useGrantCourseAccess, useRevokeCourseAccess } from '@/lib/hooks/useCourses'
import { useToast } from '@/hooks/use-toast'
import type { CourseStudent } from '@/lib/api/courses'

// ─── Grant access dialog ──────────────────────────────────────────────────────

const GrantSchema = z.object({ email: z.string().email('Enter a valid email') })
type GrantValues = z.infer<typeof GrantSchema>

function GrantAccessDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const grant = useGrantCourseAccess(courseId)
  const { toast } = useToast()
  const form = useForm<GrantValues>({ resolver: zodResolver(GrantSchema), defaultValues: { email: '' } })

  const onSubmit = async (values: GrantValues) => {
    try {
      await grant.mutateAsync(values.email)
      toast({ title: 'Access granted', description: `${values.email} has been enrolled.` })
      onOpenChange(false)
      form.reset()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not grant access'
      toast({ title: 'Failed', description: msg, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Grant course access</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="student@example.com" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={grant.isPending}>
                {grant.isPending ? 'Enrolling…' : 'Grant access'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Revoke confirm dialog ────────────────────────────────────────────────────

function RevokeDialog({
  student,
  courseId,
  onDone,
}: {
  student: CourseStudent | null
  courseId: string
  onDone: () => void
}) {
  const revoke = useRevokeCourseAccess(courseId)
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!student) return
    try {
      await revoke.mutateAsync(student.userId)
      toast({ title: 'Access revoked', description: `${student.name} has been removed from this course.` })
      onDone()
    } catch {
      toast({ title: 'Failed to revoke access', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!student} onOpenChange={(open) => { if (!open) onDone() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Revoke access</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remove <span className="font-medium">{student?.name}</span> from this course? Their progress will be preserved but they will lose access.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={revoke.isPending} onClick={handleConfirm}>
            {revoke.isPending ? 'Revoking…' : 'Revoke access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Students table ───────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {[100, 140, 80, 60, 80, 40].map((w, j) => (
            <TableCell key={j}>
              <Skeleton className={`h-4`} style={{ width: w }} />
            </TableCell>
          ))}
          <TableCell><Skeleton className="h-7 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-sm text-gray-400">No limit</span>
  const expired = new Date(expiresAt) < new Date()
  return (
    <Badge
      className={
        expired
          ? 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          : 'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }
    >
      {expired ? 'Expired' : formatDate(expiresAt)}
    </Badge>
  )
}

type StudentsTableProps = {
  courseId: string
}

function StudentsTable({ courseId }: StudentsTableProps) {
  const { data: students, isLoading } = useCourseStudents(courseId)
  const [grantOpen, setGrantOpen] = useState(false)
  const [revoking, setRevoking] = useState<CourseStudent | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {students ? `${students.length} enrolled student${students.length !== 1 ? 's' : ''}` : ''}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setGrantOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Grant access
        </Button>
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="w-32">Progress</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : !students || students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-400">
                  No students enrolled in this course yet.
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.userId}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-50">{s.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{s.email}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(s.enrolledAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.progress} className="h-1.5 w-16" />
                      <span className="text-xs text-gray-500">{s.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge expiresAt={s.expiresAt} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                      title="Revoke access"
                      onClick={() => setRevoking(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GrantAccessDialog courseId={courseId} open={grantOpen} onOpenChange={setGrantOpen} />
      <RevokeDialog student={revoking} courseId={courseId} onDone={() => setRevoking(null)} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCourseStudentsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Students</h1>
        <p className="mt-1 text-sm text-gray-500">Manage enrollment and access for this course.</p>
      </div>
      <StudentsTable courseId={id} />
    </div>
  )
}

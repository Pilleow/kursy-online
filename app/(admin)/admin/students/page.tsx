'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSchoolStudents, useRemoveSchoolMember, useEnrollStudentInCourse } from '@/lib/hooks/useSchoolStudents'
import { useCourses } from '@/lib/hooks/useCourses'
import { useAuthStore } from '@/lib/store/authStore'
import { useToast } from '@/hooks/use-toast'
import type { SchoolStudent } from '@/lib/api/school'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function lastActive(student: SchoolStudent): string {
  const progress = student.user.lessonProgresses[0]?.completedAt
  if (progress) return formatDate(progress)
  const lastEnroll = student.user.enrollments[0]?.enrolledAt
  return lastEnroll ? formatDate(lastEnroll) : '—'
}

// ─── Enroll modal ─────────────────────────────────────────────────────────────

const EnrollSchema = z.object({ courseId: z.string().min(1, 'Select a course') })
type EnrollValues = z.infer<typeof EnrollSchema>

function EnrollModal({
  student,
  onDone,
}: {
  student: SchoolStudent | null
  onDone: () => void
}) {
  const schoolId = useAuthStore((s) => s.schoolId)
  const { data: courses } = useCourses(schoolId ?? '')
  const enroll = useEnrollStudentInCourse()
  const { toast } = useToast()

  const form = useForm<EnrollValues>({
    resolver: zodResolver(EnrollSchema),
    defaultValues: { courseId: '' },
  })

  const onSubmit = async (values: EnrollValues) => {
    if (!student) return
    try {
      await enroll.mutateAsync({ courseId: values.courseId, email: student.user.email })
      toast({
        title: 'Enrolled',
        description: `${student.user.firstName} has been enrolled in the course.`,
      })
      onDone()
      form.reset()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not enroll student'
      toast({ title: 'Failed', description: msg, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!student} onOpenChange={(open) => { if (!open) onDone() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enroll in course</DialogTitle>
        </DialogHeader>
        {student && (
          <p className="text-sm text-gray-500">
            Enrolling <span className="font-medium text-gray-900 dark:text-gray-50">{student.user.firstName} {student.user.lastName}</span>
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(courses ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
              <Button type="submit" disabled={enroll.isPending}>
                {enroll.isPending ? 'Enrolling…' : 'Enroll student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Remove confirm dialog ────────────────────────────────────────────────────

function RemoveDialog({
  student,
  onDone,
}: {
  student: SchoolStudent | null
  onDone: () => void
}) {
  const remove = useRemoveSchoolMember()
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!student) return
    try {
      await remove.mutateAsync(student.userId)
      toast({
        title: 'Student removed',
        description: `${student.user.firstName} ${student.user.lastName} has been removed from the school.`,
      })
      onDone()
    } catch {
      toast({ title: 'Failed to remove student', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!student} onOpenChange={(open) => { if (!open) onDone() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove from school</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remove <span className="font-medium">{student?.user.firstName} {student?.user.lastName}</span> from the school? They will lose access to all enrolled courses.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={handleConfirm}>
            {remove.isPending ? 'Removing…' : 'Remove from school'}
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
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {[120, 160, 80, 40, 80].map((w, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4" style={{ width: w }} />
            </TableCell>
          ))}
          <TableCell className="flex gap-1.5">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function AdminStudentsPage() {
  const { data: students, isLoading } = useSchoolStudents()
  const [enrollTarget, setEnrollTarget] = useState<SchoolStudent | null>(null)
  const [removeTarget, setRemoveTarget] = useState<SchoolStudent | null>(null)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Students</h1>
          <p className="mt-1 text-sm text-gray-500">All students enrolled in your school.</p>
        </div>
        {students && (
          <p className="text-sm text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : !students || students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-400">
                  No students in your school yet.
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.userId}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-50">
                    {s.user.firstName} {s.user.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{s.user.email}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(s.createdAt)}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {s.user.enrollments.length}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{lastActive(s)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Enroll in course"
                        onClick={() => setEnrollTarget(s)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        title="Remove from school"
                        onClick={() => setRemoveTarget(s)}
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

      <EnrollModal student={enrollTarget} onDone={() => setEnrollTarget(null)} />
      <RemoveDialog student={removeTarget} onDone={() => setRemoveTarget(null)} />
    </div>
  )
}

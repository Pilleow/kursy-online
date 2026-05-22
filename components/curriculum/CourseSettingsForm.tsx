'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCourse, useUpdateCourseSettings } from '@/lib/hooks/useCourses'
import { useUpdateCourse } from '@/lib/hooks/useCourses'
import { useToast } from '@/hooks/use-toast'

// ─── Form schema ──────────────────────────────────────────────────────────────

const FormSchema = z.object({
  price: z.number().min(0, 'Price must be 0 or more'),
  currency: z.enum(['PLN', 'EUR', 'USD']),
  accessDurationDays: z.number().int().positive('Must be a positive integer').nullable(),
  requireAllLessons: z.boolean(),
  minimumQuizScore: z.number().min(0).max(100).nullable(),
})

type FormValues = z.infer<typeof FormSchema>

// ─── Archive dialog ───────────────────────────────────────────────────────────

function ArchiveDialog({
  open,
  onOpenChange,
  courseTitle,
  onConfirm,
  busy,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  courseTitle: string
  onConfirm: () => void
  busy: boolean
}) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive course</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Archiving hides the course from students. This can be undone later by changing the status back to published. To confirm, type the course title below:
        </p>
        <p className="mt-1 rounded bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-mono text-gray-800 dark:text-gray-200">
          {courseTitle}
        </p>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type course title to confirm"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={typed !== courseTitle || busy}
            onClick={onConfirm}
          >
            {busy ? 'Archiving…' : 'Archive course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function CourseSettingsForm({ courseId }: { courseId: string }) {
  const { data: course, isLoading } = useCourse(courseId)
  const updateSettings = useUpdateCourseSettings(courseId)
  const updateCourse = useUpdateCourse()
  const { toast } = useToast()
  const router = useRouter()
  const [archiveOpen, setArchiveOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      price: 0,
      currency: 'USD',
      accessDurationDays: null,
      requireAllLessons: false,
      minimumQuizScore: null,
    },
  })

  useEffect(() => {
    if (!course) return
    const req = course.completionRequirements as {
      requireAllLessons?: boolean
      minimumQuizScore?: number | null
    }
    form.reset({
      price: course.priceUsd != null ? Number(course.priceUsd) : 0,
      currency: 'USD',
      accessDurationDays: course.accessDurationDays ?? null,
      requireAllLessons: req.requireAllLessons ?? false,
      minimumQuizScore: req.minimumQuizScore ?? null,
    })
  }, [course])

  const onSubmit = async (values: FormValues) => {
    try {
      await updateSettings.mutateAsync({
        price: values.price,
        currency: values.currency,
        accessDurationDays: values.accessDurationDays ?? undefined,
        completionRequirements: {
          requireAllLessons: values.requireAllLessons,
          minimumQuizScore: values.minimumQuizScore,
        },
      })
      toast({ title: 'Settings saved' })
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' })
    }
  }

  const handleArchive = async () => {
    try {
      await updateCourse.mutateAsync({ id: courseId, body: { status: 'archived' } })
      toast({ title: 'Course archived' })
      setArchiveOpen(false)
      router.push('/admin/courses')
    } catch {
      toast({ title: 'Failed to archive course', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Pricing */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Pricing</h2>
              <p className="text-xs text-gray-500 mt-0.5">Set the enrollment price and currency.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PLN">PLN</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Access */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Access</h2>
              <p className="text-xs text-gray-500 mt-0.5">How long enrolled students can access this course.</p>
            </div>
            <FormField
              control={form.control}
              name="accessDurationDays"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Access duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Unlimited"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>Leave blank for unlimited access.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Completion requirements */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Completion requirements</h2>
              <p className="text-xs text-gray-500 mt-0.5">Criteria a student must meet to receive a certificate.</p>
            </div>
            <FormField
              control={form.control}
              name="requireAllLessons"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2.5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="requireAllLessons"
                    />
                  </FormControl>
                  <FormLabel htmlFor="requireAllLessons" className="cursor-pointer font-normal">
                    Require all lessons completed
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumQuizScore"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Minimum quiz score (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="No minimum"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>Average score across all quizzes. Leave blank to skip.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </form>
      </Form>

      {/* Danger Zone */}
      <div className="mt-12 rounded-lg border border-red-200 dark:border-red-900 p-6">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Archiving this course stops new enrollments. Enrolled users can still progress through the course.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setArchiveOpen(true)}
          disabled={course?.status === 'archived'}
        >
          {course?.status === 'archived' ? 'Already archived' : 'Archive course'}
        </Button>
      </div>

      <ArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        courseTitle={course?.title ?? ''}
        onConfirm={handleArchive}
        busy={updateCourse.isPending}
      />
    </>
  )
}

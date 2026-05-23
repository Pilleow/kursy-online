'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@/lib/hooks/useAdminEnrollments'
import { useCourses } from '@/lib/hooks/useCourses'
import { useAuthStore } from '@/lib/store/authStore'
import type { CouponWithCourse } from '@/lib/api/school'

// ─── Schema ───────────────────────────────────────────────────────────────────

const FormSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(64),
  discountPct: z.number({ message: 'Required' }).min(1, 'Minimum 1%').max(100, 'Maximum 100%'),
  courseId: z.string().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().optional(),
})

type FormValues = z.infer<typeof FormSchema>

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function fmt(iso: string | Date | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({
  coupon,
  onClose,
}: {
  coupon: CouponWithCourse | null
  onClose: () => void
}) {
  const del = useDeleteCoupon()
  const { toast } = useToast()

  async function handleDelete() {
    if (!coupon) return
    try {
      await del.mutateAsync(coupon.id)
      toast({ title: 'Coupon deleted' })
      onClose()
    } catch {
      toast({ title: 'Failed to delete coupon', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!coupon} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete coupon</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Delete coupon{' '}
          <span className="font-mono font-medium">{coupon?.code}</span>? This cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={del.isPending} onClick={handleDelete}>
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add / edit form dialog ───────────────────────────────────────────────────

function CouponFormDialog({
  open,
  editing,
  courses,
  onClose,
}: {
  open: boolean
  editing: CouponWithCourse | null
  courses: { id: string; title: string }[]
  onClose: () => void
}) {
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const { toast } = useToast()
  const isEditing = !!editing

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: editing
      ? {
          code: editing.code,
          discountPct: editing.discountPct,
          courseId: editing.courseId ?? undefined,
          maxUses: editing.maxUses ?? null,
          expiresAt: editing.expiresAt
            ? new Date(editing.expiresAt).toISOString().split('T')[0]
            : '',
        }
      : { code: '', discountPct: 10, courseId: undefined, maxUses: null, expiresAt: '' },
  })

  async function onSubmit(values: FormValues) {
    const expiresAt = values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined
    try {
      if (isEditing) {
        await updateCoupon.mutateAsync({
          id: editing!.id,
          code: values.code,
          discountPct: values.discountPct,
          courseId: values.courseId ?? null,
          maxUses: values.maxUses ?? null,
          expiresAt: expiresAt ?? null,
        })
        toast({ title: 'Coupon updated' })
      } else {
        await createCoupon.mutateAsync({
          code: values.code,
          discountPct: values.discountPct,
          courseId: values.courseId,
          maxUses: values.maxUses ?? undefined,
          expiresAt,
        })
        toast({ title: 'Coupon created' })
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast({
        title: isEditing ? 'Failed to update coupon' : 'Failed to create coupon',
        description: msg,
        variant: 'destructive',
      })
    }
  }

  const isPending = createCoupon.isPending || updateCoupon.isPending

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit coupon' : 'Add coupon'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g. SUMMER25"
                        {...field}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => form.setValue('code', randomCode())}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount % */}
            <FormField
              control={form.control}
              name="discountPct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="10"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Course{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '__all__' ? undefined : v)}
                    value={field.value ?? '__all__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All courses" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__all__">All courses</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max uses */}
            <FormField
              control={form.control}
              name="maxUses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Max uses{' '}
                    <span className="text-muted-foreground font-normal">(optional — blank = unlimited)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry date */}
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expiry date{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? (isEditing ? 'Saving…' : 'Creating…')
                  : (isEditing ? 'Save changes' : 'Create coupon')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {[80, 60, 120, 80, 90, 60].map((w, j) => (
            <TableCell key={j}><Skeleton className="h-4" style={{ width: w }} /></TableCell>
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

// ─── Main component ───────────────────────────────────────────────────────────

export function CouponManager() {
  const { data: coupons, isLoading } = useCoupons()
  const schoolId = useAuthStore((s) => s.schoolId) ?? ''
  const { data: courses } = useCourses(schoolId)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CouponWithCourse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CouponWithCourse | null>(null)

  function openAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(coupon: CouponWithCourse) {
    setEditTarget(coupon)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditTarget(null)
  }

  const coursesForSelect = courses?.map((c) => ({ id: c.id, title: c.title })) ?? []

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Coupons</h2>
          <p className="text-sm text-gray-500">Discount codes for your courses.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add coupon
        </Button>
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : !coupons || coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  No coupons yet.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => {
                const isExpired = c.expiresAt ? new Date(c.expiresAt) <= new Date() : false
                const isExhausted = c.maxUses !== null && c.usedCount >= c.maxUses
                const inactive = isExpired || isExhausted

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{c.code}</span>
                    </TableCell>
                    <TableCell className="font-medium">{c.discountPct}%</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {c.course?.title ?? (
                        <span className="text-muted-foreground italic">All courses</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {c.usedCount}
                      {c.maxUses !== null ? ` / ${c.maxUses}` : ''}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{fmt(c.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={inactive ? 'secondary' : 'default'}
                        className={inactive
                          ? 'text-gray-500'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}
                      >
                        {isExpired ? 'expired' : isExhausted ? 'exhausted' : 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="Edit coupon"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                          title="Delete coupon"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CouponFormDialog
        open={formOpen}
        editing={editTarget}
        courses={coursesForSelect}
        onClose={closeForm}
      />

      <DeleteDialog coupon={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  )
}

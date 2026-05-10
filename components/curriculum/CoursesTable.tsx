'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Plus,
  Globe,
  Archive,
  Trash2,
  Pencil,
  Copy,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import type { Course, CourseStatus } from '@/lib/types'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { CreateCourseSchema, type CreateCourseInput } from '@/lib/schemas/course'
import {
  useCreateCourse,
  useDuplicateCourse,
  usePublishCourse,
  useUpdateCourse,
} from '@/lib/hooks/useCourses'
import { useJob } from '@/lib/hooks/useJob'
import { useToast } from '@/hooks/use-toast'
import { deleteCourse } from '@/lib/api/courses'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CourseStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className:
      'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  published: {
    label: 'Published',
    className:
      'border-transparent bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  },
  archived: {
    label: 'Archived',
    className:
      'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return <Badge className={className}>{label}</Badge>
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

type SortKey = 'title' | 'status' | 'updatedAt'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />
  return sortDir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  )
}

function sortCourses(courses: Course[], key: SortKey, dir: SortDir): Course[] {
  return [...courses].sort((a, b) => {
    let cmp = 0
    if (key === 'title') cmp = a.title.localeCompare(b.title)
    else if (key === 'status') cmp = a.status.localeCompare(b.status)
    else if (key === 'updatedAt')
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="w-10">
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="w-10" />
        </TableRow>
      ))}
    </>
  )
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

type CourseBulkBarProps = {
  selectedIds: string[]
  onPublishAll: () => void
  onArchiveAll: () => void
  onDeleteSelected: () => void
  onClear: () => void
  busy: boolean
}

function CourseBulkBar({
  selectedIds,
  onPublishAll,
  onArchiveAll,
  onDeleteSelected,
  onClear,
  busy,
}: CourseBulkBarProps) {
  if (selectedIds.length === 0) return null
  const label = selectedIds.length === 1 ? '1 course' : `${selectedIds.length} courses`

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white shadow-xl px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
          {label} selected
        </span>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={onPublishAll}
          className="h-7 gap-1.5 px-2.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
        >
          <Globe className="h-3.5 w-3.5" />
          Publish All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={onArchiveAll}
          className="h-7 gap-1.5 px-2.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={onDeleteSelected}
          className="h-7 gap-1.5 px-2.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Selected
        </Button>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Create course dialog ─────────────────────────────────────────────────────

function CreateCourseButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateCourse()

  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(CreateCourseSchema),
    defaultValues: { title: '' },
  })

  const onSubmit = async (values: CreateCourseInput) => {
    const course = await mutateAsync(values)
    setOpen(false)
    form.reset()
    router.push(`/admin/courses/${course.id}`)
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        New course
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create course</DialogTitle>
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
                      <Input placeholder="e.g. Introduction to React" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating…' : 'Create course'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main table ───────────────────────────────────────────────────────────────

type CoursesTableProps = {
  courses: Course[]
  isLoading: boolean
}

export function CoursesTable({ courses, isLoading }: CoursesTableProps) {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [bulkBusy, setBulkBusy] = useState(false)

  const publishMutation = usePublishCourse()
  const updateMutation = useUpdateCourse()
  const duplicateMutation = useDuplicateCourse()
  const [duplicateJobId, setDuplicateJobId] = useState<string | null>(null)
  const duplicateJob = useJob(duplicateJobId)
  const { toast } = useToast()

  useEffect(() => {
    if (duplicateJob.data?.status === 'completed') {
      qc.invalidateQueries({ queryKey: ['courses'] })
      setDuplicateJobId(null)
      toast({ title: 'Course duplicated', description: 'The copy is ready.' })
    } else if (duplicateJob.data?.status === 'failed') {
      setDuplicateJobId(null)
      toast({ title: 'Duplication failed', description: duplicateJob.data.error ?? 'Unknown error', variant: 'destructive' })
    }
  }, [duplicateJob.data?.status])

  const sorted = useMemo(
    () => sortCourses(courses, sortKey, sortDir),
    [courses, sortKey, sortDir],
  )

  const allSelected = sorted.length > 0 && sorted.every((c) => selectedIds.has(c.id))
  const someSelected = sorted.some((c) => selectedIds.has(c.id)) && !allSelected

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      else { setSortKey(key); setSortDir('asc') }
    },
    [sortKey],
  )

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(sorted.map((c) => c.id)))
  }

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedList = Array.from(selectedIds)

  const handlePublishAll = async () => {
    setBulkBusy(true)
    try {
      await Promise.all(selectedList.map((id) => publishMutation.mutateAsync(id)))
      qc.invalidateQueries({ queryKey: ['courses'] })
    } finally {
      setBulkBusy(false)
      setSelectedIds(new Set())
    }
  }

  const handleArchiveAll = async () => {
    setBulkBusy(true)
    try {
      await Promise.all(
        selectedList.map((id) => updateMutation.mutateAsync({ id, body: { status: 'archived' } })),
      )
      qc.invalidateQueries({ queryKey: ['courses'] })
    } finally {
      setBulkBusy(false)
      setSelectedIds(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedList.length} course${selectedList.length > 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkBusy(true)
    try {
      await Promise.all(selectedList.map((id) => deleteCourse(id)))
      qc.invalidateQueries({ queryKey: ['courses'] })
    } finally {
      setBulkBusy(false)
      setSelectedIds(new Set())
    }
  }

  const SortableHead = ({ col, children }: { col: SortKey; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}
    >
      {children}
      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </TableHead>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Courses</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all courses in your school.</p>
        </div>
        <CreateCourseButton />
      </div>

      <div className="rounded-lg border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pr-0">
                <Checkbox
                  checked={allSelected}
                  // indeterminate state via data attribute trick
                  data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <SortableHead col="title">Title</SortableHead>
              <SortableHead col="status">Status</SortableHead>
              <TableHead>Price</TableHead>
              <TableHead>Enrolled</TableHead>
              <SortableHead col="updatedAt">Last updated</SortableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  No courses yet. Create your first course.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  selected={selectedIds.has(course.id)}
                  onToggle={() => toggleRow(course.id)}
                  onDuplicate={async () => {
                    const { jobId } = await duplicateMutation.mutateAsync(course.id)
                    setDuplicateJobId(jobId)
                  }}
                  onArchive={() =>
                    updateMutation.mutate({ id: course.id, body: { status: 'archived' } })
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CourseBulkBar
        selectedIds={selectedList}
        onPublishAll={handlePublishAll}
        onArchiveAll={handleArchiveAll}
        onDeleteSelected={handleDeleteSelected}
        onClear={() => setSelectedIds(new Set())}
        busy={bulkBusy}
      />
    </div>
  )
}

// ─── Individual row ───────────────────────────────────────────────────────────

type CourseRowProps = {
  course: Course
  selected: boolean
  onToggle: () => void
  onDuplicate: () => void
  onArchive: () => void
}

function CourseRow({ course, selected, onToggle, onDuplicate, onArchive }: CourseRowProps) {
  const updatedAt = new Date(course.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const price = course.priceUsd != null ? `$${Number(course.priceUsd).toFixed(2)}` : 'Free'

  return (
    <TableRow data-state={selected ? 'selected' : undefined}>
      <TableCell className="w-10 pr-0">
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${course.title}`} />
      </TableCell>
      <TableCell className="font-medium">
        <Link
          href={`/admin/courses/${course.id}`}
          className="hover:underline focus-visible:underline"
        >
          {course.title}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={course.status} />
      </TableCell>
      <TableCell className="text-sm text-gray-600 dark:text-gray-400">{price}</TableCell>
      <TableCell className="text-sm text-gray-600 dark:text-gray-400">—</TableCell>
      <TableCell className="text-sm text-gray-500">{updatedAt}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Row actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${course.id}`}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="mr-2 h-3.5 w-3.5" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAdminEnrollments } from '@/lib/hooks/useAdminEnrollments'
import { useCourses } from '@/lib/hooks/useCourses'
import { useAuthStore } from '@/lib/store/authStore'

const PAGE_SIZE = 25

function fmt(iso: string | Date | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function enrollmentStatus(expiresAt: string | null): 'active' | 'expired' {
  if (!expiresAt) return 'active'
  return new Date(expiresAt) > new Date() ? 'active' : 'expired'
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {[140, 160, 100, 80, 90, 100, 70].map((w, j) => (
            <TableCell key={j}><Skeleton className="h-4" style={{ width: w }} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function EnrollmentsTable() {
  const [page, setPage] = useState(1)
  const [courseId, setCourseId] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useAdminEnrollments({
    page,
    limit: PAGE_SIZE,
    courseId,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })

  const schoolId = useAuthStore((s) => s.schoolId) ?? ''
  const { data: courses } = useCourses(schoolId)

  const enrollments = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function handleCourseChange(val: string) {
    setCourseId(val === '__all__' ? undefined : val)
    setPage(1)
  }

  function handleDateChange(field: 'from' | 'to', val: string) {
    if (field === 'from') setDateFrom(val)
    else setDateTo(val)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select onValueChange={handleCourseChange} defaultValue="__all__">
          <SelectTrigger className="h-8 w-52 text-sm">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All courses</SelectItem>
            {courses?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">From</span>
          <Input
            type="date"
            className="h-8 w-36 text-sm"
            value={dateFrom}
            onChange={(e) => handleDateChange('from', e.target.value)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            className="h-8 w-36 text-sm"
            value={dateTo}
            onChange={(e) => handleDateChange('to', e.target.value)}
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Amount paid</TableHead>
              <TableHead>Coupon</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((e) => {
                const status = enrollmentStatus(e.expiresAt)
                const price = e.pricePaid !== null ? `$${Number(e.pricePaid).toFixed(2)}` : 'Free'
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-50">
                        {e.user.firstName} {e.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{e.user.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                      {e.course.title}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{fmt(e.enrolledAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{price}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {e.coupon ? (
                        <span title={`${e.coupon.discountPct}% off`} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {e.coupon.code}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{fmt(e.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={status === 'active' ? 'default' : 'secondary'}
                        className={status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'text-gray-500'}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} enrollment{total !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

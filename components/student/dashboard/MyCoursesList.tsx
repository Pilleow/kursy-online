'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseCard } from './CourseCard'
import type { EnrollmentWithCourse } from '@/lib/api/enrollments'
import type { CertificateWithCourse } from '@/lib/api/progress'

type Props = {
  enrollments: EnrollmentWithCourse[]
  certificates: CertificateWithCourse[]
  isLoading: boolean
}

function CourseCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <Skeleton className="h-24 w-36 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  )
}

export function MyCoursesList({ enrollments, certificates, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
          <BookOpen className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No courses yet</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Enroll in a course to start learning and track your progress here.
        </p>
        <Button asChild>
          <Link href="/">Browse Courses</Link>
        </Button>
      </div>
    )
  }

  const certByCourseId = new Map(certificates.map((c) => [c.courseId, c]))

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment) => (
        <CourseCard
          key={enrollment.id}
          enrollment={enrollment}
          certificate={certByCourseId.get(enrollment.courseId)}
        />
      ))}
    </div>
  )
}

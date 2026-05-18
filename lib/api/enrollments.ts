import type { Enrollment, CourseStatus } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type ListEnrollmentsParams = {
  schoolId?: string
  courseId?: string
}

export type EnrollmentWithCourse = Omit<Enrollment, 'createdAt' | 'updatedAt' | 'enrolledAt' | 'completedAt'> & {
  enrolledAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnailUrl: string | null
    status: CourseStatus
    priceUsd: number | null
    instructorName: string | null
  }
  coupon: { code: string; discountPct: number } | null
}

export function listEnrollments(params: ListEnrollmentsParams): Promise<Enrollment[]> {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()
  return apiFetch(`${BASE}/enrollments${qs ? `?${qs}` : ''}`)
}

export function getMyEnrollments(): Promise<EnrollmentWithCourse[]> {
  return apiFetch(`${BASE}/enrollments`)
}

export function createEnrollment(body: {
  courseId: string
  userId?: string
  couponCode?: string
}): Promise<Enrollment> {
  return apiFetch(`${BASE}/enrollments`, { method: 'POST', body: JSON.stringify(body) })
}

export function deleteEnrollment(id: string): Promise<void> {
  return apiFetch(`${BASE}/enrollments/${id}`, { method: 'DELETE' })
}

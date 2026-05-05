import type { Enrollment } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type ListEnrollmentsParams = {
  schoolId?: string
  courseId?: string
}

export function listEnrollments(params: ListEnrollmentsParams): Promise<Enrollment[]> {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()
  return apiFetch(`${BASE}/enrollments${qs ? `?${qs}` : ''}`)
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

import type { School, SchoolMembership, SchoolRole, Coupon, ApiKey } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

// School students (enriched membership view)

export type SchoolStudent = {
  id: string
  schoolId: string
  userId: string
  role: SchoolRole
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    createdAt: string
    enrollments: Array<{ id: string; enrolledAt: string }>
    lessonProgresses: Array<{ completedAt: string | null }>
    moduleAssignments: Array<{ moduleId: string }>
  }
}

export function listSchoolStudents(): Promise<SchoolStudent[]> {
  return apiFetch(`${BASE}/school/members?role=student`)
}

export function removeSchoolMember(userId: string): Promise<void> {
  return apiFetch(`${BASE}/school/members/${userId}`, { method: 'DELETE' })
}

// School instructors (enriched membership view)

export type SchoolInstructor = {
  id: string
  schoolId: string
  userId: string
  role: SchoolRole
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    createdAt: string
    enrollments: Array<{ id: string; enrolledAt: string }>
    lessonProgresses: Array<{ completedAt: string | null }>
    moduleAssignments: Array<{ moduleId: string }>
  }
}

export function listSchoolInstructors(): Promise<SchoolInstructor[]> {
  return apiFetch(`${BASE}/school/members?role=instructor`)
}

export function removeInstructor(userId: string): Promise<void> {
  return apiFetch(`${BASE}/school/members/${userId}`, { method: 'DELETE' })
}

export type InviteInstructorResponse = {
  status: 'invited' | 'promoted' | 'added'
  message?: string
  member?: unknown
}

export function inviteInstructor(email: string): Promise<InviteInstructorResponse> {
  return apiFetch(`${BASE}/school/members/invite`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function enrollStudentInCourse(courseId: string, email: string): Promise<unknown> {
  return apiFetch(`${BASE}/courses/${courseId}/access`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// School

export function getSchool(id: string): Promise<School> {
  return apiFetch(`${BASE}/schools/${id}`)
}

export function updateSchool(id: string, body: Partial<School>): Promise<School> {
  return apiFetch(`${BASE}/schools/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

// Members

export function listMembers(schoolId: string): Promise<SchoolMembership[]> {
  return apiFetch(`${BASE}/schools/${schoolId}/members`)
}

export function addMember(
  schoolId: string,
  body: { email: string; role: SchoolRole }
): Promise<SchoolMembership> {
  return apiFetch(`${BASE}/schools/${schoolId}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateMemberRole(
  schoolId: string,
  userId: string,
  body: { role: SchoolRole }
): Promise<SchoolMembership> {
  return apiFetch(`${BASE}/schools/${schoolId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function removeMember(schoolId: string, userId: string): Promise<void> {
  return apiFetch(`${BASE}/schools/${schoolId}/members/${userId}`, { method: 'DELETE' })
}

// Coupons

export type CouponWithCourse = Coupon & {
  course: { id: string; title: string; slug: string } | null
}

export function listCoupons(): Promise<CouponWithCourse[]> {
  return apiFetch(`${BASE}/school/coupons`)
}

export function createCoupon(body: {
  code: string
  discountPct: number
  courseId?: string
  maxUses?: number
  expiresAt?: string
}): Promise<CouponWithCourse> {
  return apiFetch(`${BASE}/school/coupons`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateCoupon(
  id: string,
  body: Partial<{
    code: string
    discountPct: number
    courseId: string | null
    maxUses: number | null
    expiresAt: string | null
  }>,
): Promise<CouponWithCourse> {
  return apiFetch(`${BASE}/school/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteCoupon(couponId: string): Promise<void> {
  return apiFetch(`${BASE}/school/coupons/${couponId}`, { method: 'DELETE' })
}

// Admin enrollments

export type AdminEnrollment = {
  id: string
  courseId: string
  userId: string
  schoolId: string
  couponId: string | null
  pricePaid: string | number | null
  enrolledAt: string
  expiresAt: string | null
  completedAt: string | null
  user: { firstName: string; lastName: string; email: string }
  course: { id: string; title: string }
  coupon: { code: string; discountPct: number } | null
}

export type AdminEnrollmentsResponse = {
  data: AdminEnrollment[]
  meta: { page: number; limit: number; total: number }
}

export function listAdminEnrollments(params?: {
  page?: number
  limit?: number
  courseId?: string
  from?: string
  to?: string
}): Promise<AdminEnrollmentsResponse> {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.courseId) q.set('courseId', params.courseId)
  if (params?.from) q.set('from', params.from)
  if (params?.to) q.set('to', params.to)
  const qs = q.toString()
  return apiFetch(`${BASE}/admin/enrollments${qs ? `?${qs}` : ''}`)
}

// API Keys

export type ApiKeyWithSecret = ApiKey & { key: string }

export function listApiKeys(schoolId: string): Promise<ApiKey[]> {
  return apiFetch(`${BASE}/schools/${schoolId}/api-keys`)
}

export function createApiKey(
  schoolId: string,
  body: { name: string; expiresAt?: string }
): Promise<ApiKeyWithSecret> {
  return apiFetch(`${BASE}/schools/${schoolId}/api-keys`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteApiKey(schoolId: string, keyId: string): Promise<void> {
  return apiFetch(`${BASE}/schools/${schoolId}/api-keys/${keyId}`, { method: 'DELETE' })
}

// Translations

export type TranslationMap = Record<string, Record<string, string>>

export function getTranslations(schoolId: string): Promise<TranslationMap> {
  return apiFetch(`${BASE}/schools/${schoolId}/translations`)
}

export function updateTranslations(
  schoolId: string,
  body: TranslationMap
): Promise<TranslationMap> {
  return apiFetch(`${BASE}/schools/${schoolId}/translations`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

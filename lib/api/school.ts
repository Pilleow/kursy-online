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
  }
}

export function listSchoolStudents(): Promise<SchoolStudent[]> {
  return apiFetch(`${BASE}/school/members?role=student`)
}

export function removeSchoolMember(userId: string): Promise<void> {
  return apiFetch(`${BASE}/school/members/${userId}`, { method: 'DELETE' })
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

export function listCoupons(schoolId: string): Promise<Coupon[]> {
  return apiFetch(`${BASE}/schools/${schoolId}/coupons`)
}

export function createCoupon(schoolId: string, body: Partial<Coupon>): Promise<Coupon> {
  return apiFetch(`${BASE}/schools/${schoolId}/coupons`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteCoupon(schoolId: string, couponId: string): Promise<void> {
  return apiFetch(`${BASE}/schools/${schoolId}/coupons/${couponId}`, { method: 'DELETE' })
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

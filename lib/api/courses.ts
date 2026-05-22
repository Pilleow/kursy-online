import type { Course, Module, Lesson, Block, LessonType, CompletionRequirements } from '@/lib/types'
import { apiFetch } from './client'

export type LessonSummary = {
  id: string
  title: string
  position: number
  type: LessonType
  durationS: number | null
}

export type ModuleSummary = {
  id: string
  title: string
  position: number
  lessons: LessonSummary[]
}

export type CourseWithCurriculum = Course & {
  modules: ModuleSummary[]
}

const BASE = '/api/v1'

export type ContentReviewWithRelations = {
  id: string
  lessonId: string
  courseId: string
  schoolId: string
  instructorId: string
  changeSnapshot: Block[]
  status: 'pending' | 'approved' | 'rejected'
  reviewerComment: string | null
  createdAt: string
  reviewedAt: string | null
  lesson: { id: string; title: string; blocks: Block[] }
  instructor: { id: string; firstName: string; lastName: string; email: string }
}

type CoursesResponse = { data: Course[]; meta: { page: number; limit: number; total: number } }

// Courses

export function getCourseBySlug(slug: string): Promise<CourseWithCurriculum> {
  return apiFetch(`${BASE}/public/courses/${encodeURIComponent(slug)}`)
}

export function listCourses(): Promise<Course[]> {
  return apiFetch<CoursesResponse>(`${BASE}/courses`).then((r) => r.data)
}

export function getCourse(id: string): Promise<Course> {
  return apiFetch(`${BASE}/courses/${id}`)
}

export function createCourse(body: Partial<Course>): Promise<Course> {
  return apiFetch(`${BASE}/courses`, { method: 'POST', body: JSON.stringify(body) })
}

export function updateCourse(id: string, body: Partial<Course>): Promise<Course> {
  return apiFetch(`${BASE}/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteCourse(id: string): Promise<void> {
  return apiFetch(`${BASE}/courses/${id}`, { method: 'DELETE' })
}

export function publishCourse(id: string): Promise<Course> {
  return apiFetch(`${BASE}/courses/${id}/publish`, { method: 'POST' })
}

export function duplicateCourse(id: string): Promise<{ jobId: string }> {
  return apiFetch(`${BASE}/courses/${id}/duplicate`, { method: 'POST' })
}

// Reviews

export function listCourseReviews(courseId: string): Promise<ContentReviewWithRelations[]> {
  return apiFetch(`${BASE}/courses/${courseId}/reviews`)
}

export function approveReview(courseId: string, reviewId: string): Promise<void> {
  return apiFetch(`${BASE}/courses/${courseId}/reviews/${reviewId}/approve`, { method: 'POST' })
}

export function rejectReview(
  courseId: string,
  reviewId: string,
  body: { comment: string },
): Promise<void> {
  return apiFetch(`${BASE}/courses/${courseId}/reviews/${reviewId}/reject`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Modules (curriculum)

export type ModuleWithLessons = Module & { lessons: Lesson[] }

export function listModules(courseId: string): Promise<ModuleWithLessons[]> {
  return apiFetch(`${BASE}/courses/${courseId}/modules`)
}

export function createModule(courseId: string, body: Partial<Module>): Promise<Module> {
  return apiFetch(`${BASE}/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateModule(moduleId: string, body: Partial<Module>): Promise<Module> {
  return apiFetch(`${BASE}/modules/${moduleId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteModule(moduleId: string): Promise<void> {
  return apiFetch(`${BASE}/modules/${moduleId}`, { method: 'DELETE' })
}

export function reorderModules(_courseId: string, ids: string[]): Promise<void> {
  return apiFetch(`${BASE}/modules/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ moduleIds: ids }),
  })
}

// Settings

export type CourseSettingsPayload = {
  price: number
  currency: string
  accessDurationDays?: number | null
  completionRequirements: {
    requireAllLessons?: boolean
    minimumQuizScore?: number | null
  }
}

export function updateCourseSettings(id: string, body: CourseSettingsPayload): Promise<Course> {
  return apiFetch(`${BASE}/courses/${id}/settings`, { method: 'PATCH', body: JSON.stringify(body) })
}

// Course students

export type CourseStudent = {
  userId: string
  name: string
  email: string
  enrolledAt: string
  expiresAt: string | null
  progress: number
}

export function listCourseStudents(courseId: string): Promise<CourseStudent[]> {
  return apiFetch(`${BASE}/courses/${courseId}/students`)
}

export function grantCourseAccess(courseId: string, email: string): Promise<unknown> {
  return apiFetch(`${BASE}/courses/${courseId}/access`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function revokeCourseAccess(courseId: string, userId: string): Promise<void> {
  return apiFetch(`${BASE}/courses/${courseId}/access/${userId}`, { method: 'DELETE' })
}

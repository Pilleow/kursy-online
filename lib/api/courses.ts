import type { Course, Module, Lesson } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type CourseReviewItem = {
  lessonId: string
  lessonTitle: string
  submittedAt: string
  instructorId: string
}

// Courses

export function listCourses(schoolId: string): Promise<Course[]> {
  return apiFetch(`${BASE}/courses?schoolId=${schoolId}`)
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

export function listCourseReviews(courseId: string): Promise<CourseReviewItem[]> {
  return apiFetch(`${BASE}/courses/${courseId}/reviews`)
}

export function approveReview(courseId: string, lessonId: string): Promise<void> {
  return apiFetch(`${BASE}/courses/${courseId}/reviews/${lessonId}/approve`, { method: 'POST' })
}

export function rejectReview(
  courseId: string,
  lessonId: string,
  body: { reason: string }
): Promise<void> {
  return apiFetch(`${BASE}/courses/${courseId}/reviews/${lessonId}/reject`, {
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

export function reorderModules(courseId: string, ids: string[]): Promise<void> {
  return apiFetch(`${BASE}/courses/${courseId}/modules/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  })
}

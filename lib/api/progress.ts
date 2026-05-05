import type { LessonProgress } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type CourseProgress = {
  lessons: LessonProgress[]
  completedAt: string | null
}

export function getCourseProgress(courseId: string): Promise<CourseProgress> {
  return apiFetch(`${BASE}/progress/${courseId}`)
}

export function completeLesson(lessonId: string): Promise<LessonProgress> {
  return apiFetch(`${BASE}/progress/lessons/${lessonId}/complete`, { method: 'POST' })
}

export function generateCertificate(courseId: string): Promise<{ jobId: string }> {
  return apiFetch(`${BASE}/progress/${courseId}/certificate`, { method: 'POST' })
}

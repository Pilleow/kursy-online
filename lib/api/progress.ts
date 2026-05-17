import { apiFetch } from './client'

const BASE = '/api/v1'

export type CourseProgressResponse = {
  totalLessons: number
  completedLessons: number
  percentComplete: number
  completedLessonIds: string[]
  isComplete: boolean
}

export function getCourseProgress(courseId: string): Promise<CourseProgressResponse> {
  return apiFetch(`${BASE}/courses/${courseId}/progress`)
}

export function completeLesson(lessonId: string): Promise<{ isCompleted: boolean }> {
  return apiFetch(`${BASE}/lessons/${lessonId}/complete`, { method: 'POST' })
}

export function generateCertificate(courseId: string): Promise<{ jobId: string }> {
  return apiFetch(`${BASE}/courses/${courseId}/certificate`, { method: 'POST' })
}

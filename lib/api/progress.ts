import type { Certificate } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type CertificateWithCourse = Omit<Certificate, 'issuedAt' | 'createdAt'> & {
  issuedAt: string
  createdAt: string
  course: { id: string; title: string; slug: string; thumbnailUrl: string | null }
}

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

export function generateCertificate(courseId: string): Promise<{ jobId: string; certificateId?: string }> {
  return apiFetch(`${BASE}/courses/${courseId}/certificate`, { method: 'POST' })
}

export function getCertificates(): Promise<CertificateWithCourse[]> {
  return apiFetch(`${BASE}/certificates`)
}

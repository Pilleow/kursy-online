import type { Lesson, Block } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export function listLessons(moduleId: string): Promise<Lesson[]> {
  return apiFetch(`${BASE}/modules/${moduleId}/lessons`)
}

export function getLesson(id: string): Promise<Lesson> {
  return apiFetch(`${BASE}/lessons/${id}`)
}

export function createLesson(moduleId: string, body: Partial<Lesson>): Promise<Lesson> {
  return apiFetch(`${BASE}/modules/${moduleId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateLesson(id: string, body: Partial<Lesson>): Promise<Lesson> {
  return apiFetch(`${BASE}/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteLesson(id: string): Promise<void> {
  return apiFetch(`${BASE}/lessons/${id}`, { method: 'DELETE' })
}

export function reorderLessons(moduleId: string, ids: string[]): Promise<void> {
  return apiFetch(`${BASE}/modules/${moduleId}/lessons/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  })
}

export function replaceBlocks(lessonId: string, blocks: Block[]): Promise<Lesson> {
  return apiFetch(`${BASE}/lessons/${lessonId}/blocks`, {
    method: 'PUT',
    body: JSON.stringify({ blocks }),
  })
}

export function submitLessonForReview(lessonId: string): Promise<Lesson> {
  return apiFetch(`${BASE}/lessons/${lessonId}/submit-for-review`, { method: 'POST' })
}

export type VideoInitiateResponse = { uploadUrl: string; key: string }

export function initiateVideoUpload(lessonId: string): Promise<VideoInitiateResponse> {
  return apiFetch(`${BASE}/lessons/${lessonId}/video/initiate`, { method: 'POST' })
}

export function completeVideoUpload(
  lessonId: string,
  body: { key: string }
): Promise<{ jobId: string }> {
  return apiFetch(`${BASE}/lessons/${lessonId}/video/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

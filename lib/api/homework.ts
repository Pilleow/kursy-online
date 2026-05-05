import type { Homework, HomeworkQuestion, HomeworkSubmission } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type HomeworkWithQuestions = Homework & { questions: HomeworkQuestion[] }

export function getHomework(id: string): Promise<HomeworkWithQuestions> {
  return apiFetch(`${BASE}/homework/${id}`)
}

export function createHomework(lessonId: string, body: Partial<Homework>): Promise<Homework> {
  return apiFetch(`${BASE}/lessons/${lessonId}/homework`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateHomework(id: string, body: Partial<Homework>): Promise<Homework> {
  return apiFetch(`${BASE}/homework/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteHomework(id: string): Promise<void> {
  return apiFetch(`${BASE}/homework/${id}`, { method: 'DELETE' })
}

export function listSubmissions(homeworkId: string): Promise<HomeworkSubmission[]> {
  return apiFetch(`${BASE}/homework/${homeworkId}/submissions`)
}

export function submitHomework(
  homeworkId: string,
  body: { answers: Record<string, string> }
): Promise<HomeworkSubmission> {
  return apiFetch(`${BASE}/homework/${homeworkId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function submitFeedback(
  homeworkId: string,
  submissionId: string,
  body: { score?: number; feedback: string }
): Promise<HomeworkSubmission> {
  return apiFetch(`${BASE}/homework/${homeworkId}/submissions/${submissionId}/feedback`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

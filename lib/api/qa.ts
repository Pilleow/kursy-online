import type { QAQuestion } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type QAQuestionWithMeta = QAQuestion & {
  hasUpvoted: boolean
  user: { id: string; firstName: string; lastName: string }
}

export type UpvoteResult = { upvotes: number; hasUpvoted: boolean }

export function listQA(
  lessonId: string,
  sort: 'newest' | 'popular' = 'newest',
): Promise<QAQuestionWithMeta[]> {
  return apiFetch(`${BASE}/lessons/${lessonId}/qa?sort=${sort}`)
}

export function postQuestion(
  lessonId: string,
  body: { body: string },
): Promise<QAQuestionWithMeta> {
  return apiFetch(`${BASE}/lessons/${lessonId}/qa`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function answerQuestion(
  questionId: string,
  body: { text: string },
): Promise<QAQuestionWithMeta> {
  return apiFetch(`${BASE}/qa/${questionId}/answer`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function upvoteQuestion(questionId: string): Promise<UpvoteResult> {
  return apiFetch(`${BASE}/qa/${questionId}/upvote`, { method: 'POST' })
}

export type QAQuestionWithContext = QAQuestionWithMeta & {
  lessonTitle: string
  moduleTitle: string
}

export function listCourseQA(courseId: string): Promise<QAQuestionWithContext[]> {
  return apiFetch(`${BASE}/courses/${courseId}/qa`)
}

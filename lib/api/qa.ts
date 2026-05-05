import type { QAQuestion } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export function listQA(lessonId: string): Promise<QAQuestion[]> {
  return apiFetch(`${BASE}/lessons/${lessonId}/qa`)
}

export function postQuestion(lessonId: string, body: { body: string }): Promise<QAQuestion> {
  return apiFetch(`${BASE}/lessons/${lessonId}/qa`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function answerQuestion(
  questionId: string,
  body: { answer: string }
): Promise<QAQuestion> {
  return apiFetch(`${BASE}/qa/${questionId}/answer`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function upvoteQuestion(questionId: string): Promise<QAQuestion> {
  return apiFetch(`${BASE}/qa/${questionId}/upvote`, { method: 'POST' })
}

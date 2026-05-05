import type { Quiz, QuizQuestion, QuizAttempt } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type QuizWithQuestions = Quiz & { questions: QuizQuestion[] }

export type AttemptResult = QuizAttempt & { cooldownUntil?: string }

export function getQuiz(id: string): Promise<QuizWithQuestions> {
  return apiFetch(`${BASE}/quizzes/${id}`)
}

export function createQuiz(lessonId: string, body: Partial<Quiz>): Promise<Quiz> {
  return apiFetch(`${BASE}/lessons/${lessonId}/quizzes`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateQuiz(id: string, body: Partial<Quiz>): Promise<Quiz> {
  return apiFetch(`${BASE}/quizzes/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteQuiz(id: string): Promise<void> {
  return apiFetch(`${BASE}/quizzes/${id}`, { method: 'DELETE' })
}

export function submitQuizAttempt(
  quizId: string,
  body: { answers: Record<string, string> }
): Promise<AttemptResult> {
  return apiFetch(`${BASE}/quizzes/${quizId}/attempts`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

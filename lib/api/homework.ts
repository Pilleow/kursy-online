import type { Homework, HomeworkQuestion, HomeworkSubmission } from '@/lib/types'
import type { User } from '@/lib/types/user'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type HomeworkWithQuestions = Homework & { questions: HomeworkQuestion[] }
export type SubmissionWithUser = HomeworkSubmission & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
}
export type HomeworkWithSubmissionCount = HomeworkWithQuestions & {
  _count: { submissions: number }
  pendingSubmissionsCount: number
  lesson: { title: string; moduleId: string }
}

export function getHomework(id: string): Promise<HomeworkWithQuestions> {
  return apiFetch(`${BASE}/homeworks/${id}`)
}

export function updateHomework(
  id: string,
  body: Partial<Homework & { questions: Partial<HomeworkQuestion>[] }>,
): Promise<HomeworkWithQuestions> {
  return apiFetch(`${BASE}/homeworks/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function listSubmissions(
  homeworkId: string,
): Promise<SubmissionWithUser[] | HomeworkSubmission | null> {
  return apiFetch(`${BASE}/homeworks/${homeworkId}/submissions`)
}

export function submitHomework(
  homeworkId: string,
  body: { answers: Record<string, string> },
): Promise<HomeworkSubmission> {
  return apiFetch(`${BASE}/homeworks/${homeworkId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function submitFeedback(
  submissionId: string,
  body: { feedback: string },
): Promise<HomeworkSubmission> {
  return apiFetch(`${BASE}/submissions/${submissionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listCourseHomeworks(
  courseId: string,
  includeArchived = false,
): Promise<HomeworkWithSubmissionCount[]> {
  const qs = includeArchived ? '?includeArchived=true' : ''
  return apiFetch(`${BASE}/courses/${courseId}/homeworks${qs}`)
}

export function archiveHomework(id: string): Promise<HomeworkWithQuestions> {
  return apiFetch(`${BASE}/homeworks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ archive: true }),
  })
}

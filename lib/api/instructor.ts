import type { Module, Course } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type AssignedModule = {
  assignmentId: string
  module: Module & {
    course: Pick<Course, 'id' | 'title'>
    _count?: { lessons: number }
    pendingHomeworkCount: number
    unreadQACount: number
  }
}

export type InstructorStats = {
  pendingHomeworkCount: number
  unreadQACount: number
}

export type PendingSubmission = {
  submissionId: string
  submittedAt: string
  studentName: string
  courseId: string
  courseName: string
  lessonId: string
  lessonTitle: string
  homeworkId: string
  homeworkTitle: string
}

export function listInstructorAssignments(): Promise<AssignedModule[]> {
  return apiFetch(`${BASE}/instructor/assignments`)
}

export function getInstructorStats(): Promise<InstructorStats> {
  return apiFetch(`${BASE}/instructor/stats`)
}

export function listPendingSubmissions(): Promise<PendingSubmission[]> {
  return apiFetch(`${BASE}/instructor/pending-submissions`)
}

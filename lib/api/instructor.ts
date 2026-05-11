import type { Module, Course } from '@/lib/types'
import { apiFetch } from './client'

const BASE = '/api/v1'

export type AssignedModule = {
  assignmentId: string
  module: Module & {
    course: Pick<Course, 'id' | 'title'>
    _count?: { lessons: number }
  }
}

export type InstructorStats = {
  pendingHomeworkCount: number
  unreadQACount: number
}

export function listInstructorAssignments(): Promise<AssignedModule[]> {
  return apiFetch(`${BASE}/instructor/assignments`)
}

export function getInstructorStats(): Promise<InstructorStats> {
  return apiFetch(`${BASE}/instructor/stats`)
}

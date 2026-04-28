export type JobType = 'certificate_generation' | 'course_duplicate' | 'video_processing'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type Job = {
  id: string
  schoolId: string
  userId: string
  type: JobType
  status: JobStatus
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  error: string | null
  startedAt: Date | null
  doneAt: Date | null
  createdAt: Date
  updatedAt: Date
}

import type { Job } from '@/lib/types'
import { apiFetch } from './client'

export function getJob(jobId: string): Promise<Job> {
  return apiFetch(`/api/v1/jobs/${jobId}`)
}

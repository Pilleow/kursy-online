import { useQuery } from '@tanstack/react-query'
import type { Job } from '@/lib/types'
import { getJob } from '@/lib/api/jobs'

export function useJob(jobId: string | null) {
  return useQuery<Job>({
    queryKey: ['jobs', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') return false
      return 2000
    },
  })
}

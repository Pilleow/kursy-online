import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'

export type PendingReviewsCount = { count: number }

export function usePendingReviewsCount(schoolId: string | null) {
  return useQuery({
    queryKey: ['admin', 'pending-reviews-count', schoolId],
    queryFn: (): Promise<PendingReviewsCount> =>
      apiFetch(`/api/v1/schools/${schoolId}/reviews/pending/count`),
    enabled: !!schoolId,
    refetchInterval: 30_000,
    retry: false,
  })
}

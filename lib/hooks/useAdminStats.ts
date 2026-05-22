import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import type { DashboardSummary } from '@/app/api/v1/admin/dashboard/route'

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

export function useAdminDashboard(schoolId: string | null) {
  return useQuery({
    queryKey: ['admin', 'dashboard', schoolId],
    queryFn: (): Promise<DashboardSummary> => apiFetch('/api/v1/admin/dashboard'),
    enabled: !!schoolId,
    refetchInterval: 60_000,
    retry: false,
  })
}

export type { DashboardSummary }

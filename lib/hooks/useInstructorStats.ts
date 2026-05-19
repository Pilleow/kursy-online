import { useQuery } from '@tanstack/react-query'
import { listInstructorAssignments, getInstructorStats, listPendingSubmissions } from '@/lib/api/instructor'

export function useInstructorAssignments() {
  return useQuery({
    queryKey: ['instructor', 'assignments'],
    queryFn: listInstructorAssignments,
    refetchInterval: 30_000,
    retry: false,
  })
}

export function useInstructorStats() {
  return useQuery({
    queryKey: ['instructor', 'stats'],
    queryFn: getInstructorStats,
    refetchInterval: 30_000,
    retry: false,
  })
}

export function useInstructorPendingSubmissions() {
  return useQuery({
    queryKey: ['instructor', 'pending-submissions'],
    queryFn: listPendingSubmissions,
    refetchInterval: 30_000,
    retry: false,
  })
}

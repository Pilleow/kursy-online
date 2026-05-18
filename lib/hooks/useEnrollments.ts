import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ListEnrollmentsParams } from '@/lib/api/enrollments'
import { listEnrollments, createEnrollment, deleteEnrollment, getMyEnrollments } from '@/lib/api/enrollments'

export function useEnrollments(params: ListEnrollmentsParams) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: () => listEnrollments(params),
    enabled: !!(params.schoolId || params.courseId),
  })
}

export function useCreateEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEnrollment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] })
    },
  })
}

export function useDeleteEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] })
    },
  })
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: getMyEnrollments,
  })
}

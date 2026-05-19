import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseProgress, completeLesson, generateCertificate, getCertificates, getCertificateUrls } from '@/lib/api/progress'

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => getCourseProgress(courseId),
    enabled: !!courseId,
  })
}

export function useCompleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: completeLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

export function useGenerateCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateCertificate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export function useCertificates() {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: getCertificates,
  })
}

export function useCertificateUrls(id: string, enabled = true) {
  return useQuery({
    queryKey: ['certificates', id, 'urls'],
    queryFn: () => getCertificateUrls(id),
    enabled: !!id && enabled,
    retry: (count, error) => {
      if (error instanceof Error && error.message.includes('not yet ready')) return count < 10
      return false
    },
    retryDelay: 2000,
  })
}

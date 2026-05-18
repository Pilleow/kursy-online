import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseProgress, completeLesson, generateCertificate, getCertificates } from '@/lib/api/progress'

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

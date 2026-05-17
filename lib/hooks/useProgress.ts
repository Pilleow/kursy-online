import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseProgress, completeLesson, generateCertificate } from '@/lib/api/progress'

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
  return useMutation({ mutationFn: generateCertificate })
}

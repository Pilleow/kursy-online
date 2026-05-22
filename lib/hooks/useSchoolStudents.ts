import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listSchoolStudents,
  removeSchoolMember,
  enrollStudentInCourse,
} from '@/lib/api/school'

export function useSchoolStudents() {
  return useQuery({
    queryKey: ['school', 'students'],
    queryFn: listSchoolStudents,
  })
}

export function useRemoveSchoolMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeSchoolMember(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'students'] })
    },
  })
}

export function useEnrollStudentInCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, email }: { courseId: string; email: string }) =>
      enrollStudentInCourse(courseId, email),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['courses', courseId, 'students'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Course } from '@/lib/types'
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  duplicateCourse,
  listModules,
  listCourseReviews,
} from '@/lib/api/courses'

export function useCourses(schoolId: string) {
  return useQuery({
    queryKey: ['courses', schoolId],
    queryFn: () => listCourses(schoolId),
    enabled: !!schoolId,
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => getCourse(id),
    enabled: !!id,
  })
}

export function useCourseModules(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'modules'],
    queryFn: () => listModules(courseId),
    enabled: !!courseId,
  })
}

export function useCourseReviews(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'reviews'],
    queryFn: () => listCourseReviews(courseId),
    enabled: !!courseId,
  })
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCourse,
    onSuccess: (course: Course) => {
      qc.invalidateQueries({ queryKey: ['courses', course.schoolId] })
    },
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Course> }) => updateCourse(id, body),
    onSuccess: (course: Course) => {
      qc.invalidateQueries({ queryKey: ['courses', course.id] })
      qc.invalidateQueries({ queryKey: ['courses', course.schoolId] })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function usePublishCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishCourse,
    onSuccess: (course: Course) => {
      qc.invalidateQueries({ queryKey: ['courses', course.id] })
      qc.invalidateQueries({ queryKey: ['courses', course.schoolId] })
    },
  })
}

export function useDuplicateCourse() {
  return useMutation({ mutationFn: duplicateCourse })
}

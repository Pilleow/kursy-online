import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Course, Module } from '@/lib/types'
import {
  listCourses,
  getCourse,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  duplicateCourse,
  listModules,
  createModule,
  updateModule,
  reorderModules,
  listCourseReviews,
  approveReview,
  rejectReview,
} from '@/lib/api/courses'

export function useCourses(schoolId: string) {
  return useQuery({
    queryKey: ['courses', schoolId],
    queryFn: () => listCourses(),
    enabled: !!schoolId,
  })
}

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ['courses', 'slug', slug],
    queryFn: () => getCourseBySlug(slug),
    enabled: !!slug,
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

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, title }: { courseId: string; title: string }) =>
      createModule(courseId, { title }),
    onSuccess: (_: unknown, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] })
    },
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Module> }) => updateModule(id, body),
    onSuccess: (module: Module) => {
      qc.invalidateQueries({ queryKey: ['courses', module.courseId, 'modules'] })
    },
  })
}

export function useReorderModules() {
  return useMutation({
    mutationFn: ({ courseId, ids }: { courseId: string; ids: string[] }) =>
      reorderModules(courseId, ids),
  })
}

export function useApproveReview(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => approveReview(courseId, reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', courseId, 'reviews'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pending-reviews-count'] })
    },
  })
}

export function useRejectReview(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, comment }: { reviewId: string; comment: string }) =>
      rejectReview(courseId, reviewId, { comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', courseId, 'reviews'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pending-reviews-count'] })
    },
  })
}

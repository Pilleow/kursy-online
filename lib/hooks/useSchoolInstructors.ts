import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import {
  listSchoolInstructors,
  removeInstructor,
  inviteInstructor,
} from '@/lib/api/school'
import { listCourses, listModules, replaceModuleInstructors } from '@/lib/api/courses'
import type { Course } from '@/lib/types'
import type { ModuleWithLessons } from '@/lib/api/courses'

export function useSchoolInstructors() {
  return useQuery({
    queryKey: ['school', 'instructors'],
    queryFn: listSchoolInstructors,
  })
}

export function useRemoveInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeInstructor(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'instructors'] })
    },
  })
}

export function useInviteInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => inviteInstructor(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', 'instructors'] })
    },
  })
}

export function useReplaceModuleInstructors() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, instructorIds }: { moduleId: string; instructorIds: string[] }) =>
      replaceModuleInstructors(moduleId, instructorIds),
    onSuccess: (_data, { moduleId }) => {
      qc.invalidateQueries({ queryKey: ['school', 'instructors'] })
      qc.invalidateQueries({ queryKey: ['modules', moduleId, 'instructors'] })
    },
  })
}

export type CourseWithModules = Course & { modules: ModuleWithLessons[] }

export function useAllCoursesWithModules() {
  const coursesQuery = useQuery({
    queryKey: ['courses', 'all-with-modules'],
    queryFn: listCourses,
  })

  const courses = coursesQuery.data ?? []

  const moduleQueries = useQueries({
    queries: courses.map((c) => ({
      queryKey: ['courses', c.id, 'modules'],
      queryFn: () => listModules(c.id),
      enabled: !!coursesQuery.data,
    })),
  })

  const isLoading =
    coursesQuery.isLoading || (courses.length > 0 && moduleQueries.some((q) => q.isLoading))

  const data: CourseWithModules[] = courses.map((course, i) => ({
    ...course,
    modules: moduleQueries[i]?.data ?? [],
  }))

  return { data, isLoading }
}

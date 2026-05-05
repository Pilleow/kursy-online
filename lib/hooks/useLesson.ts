import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Lesson, Block } from '@/lib/types'
import {
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  replaceBlocks,
  submitLessonForReview,
} from '@/lib/api/lessons'

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['modules', moduleId, 'lessons'],
    queryFn: () => listLessons(moduleId),
    enabled: !!moduleId,
  })
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ['lessons', id],
    queryFn: () => getLesson(id),
    enabled: !!id,
  })
}

export function useCreateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: Partial<Lesson> }) =>
      createLesson(moduleId, body),
    onSuccess: (lesson: Lesson) => {
      qc.invalidateQueries({ queryKey: ['modules', lesson.moduleId, 'lessons'] })
    },
  })
}

export function useUpdateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Lesson> }) => updateLesson(id, body),
    onSuccess: (lesson: Lesson) => {
      qc.setQueryData(['lessons', lesson.id], lesson)
      qc.invalidateQueries({ queryKey: ['modules', lesson.moduleId, 'lessons'] })
    },
  })
}

export function useDeleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules'] })
    },
  })
}

export function useReorderLessons() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, ids }: { moduleId: string; ids: string[] }) =>
      reorderLessons(moduleId, ids),
    onSuccess: (_: void, { moduleId }) => {
      qc.invalidateQueries({ queryKey: ['modules', moduleId, 'lessons'] })
    },
  })
}

export function useReplaceBlocks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, blocks }: { lessonId: string; blocks: Block[] }) =>
      replaceBlocks(lessonId, blocks),
    onSuccess: (lesson: Lesson) => {
      qc.setQueryData(['lessons', lesson.id], lesson)
    },
  })
}

export function useSubmitLessonForReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitLessonForReview,
    onSuccess: (lesson: Lesson) => {
      qc.setQueryData(['lessons', lesson.id], lesson)
    },
  })
}

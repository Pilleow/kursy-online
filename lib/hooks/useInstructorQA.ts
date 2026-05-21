import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCourseQA, answerQuestion, type QAQuestionWithContext } from '@/lib/api/qa'

export function useCourseQA(courseId: string) {
  return useQuery({
    queryKey: ['qa', 'course', courseId],
    queryFn: () => listCourseQA(courseId),
    enabled: !!courseId,
  })
}

export function useAnswerCourseQuestion(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, body }: { questionId: string; body: { text: string } }) =>
      answerQuestion(questionId, body),
    onMutate: async ({ questionId, body }) => {
      await qc.cancelQueries({ queryKey: ['qa', 'course', courseId] })
      const previous = qc.getQueryData<QAQuestionWithContext[]>(['qa', 'course', courseId])
      qc.setQueryData<QAQuestionWithContext[]>(['qa', 'course', courseId], (old) =>
        old?.map((q) =>
          q.id === questionId ? { ...q, answer: body.text, answeredAt: new Date() } : q,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['qa', 'course', courseId], ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['qa', 'course', courseId] })
      qc.invalidateQueries({ queryKey: ['instructor', 'stats'] })
      qc.invalidateQueries({ queryKey: ['instructor', 'assignments'] })
    },
  })
}

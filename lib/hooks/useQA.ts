import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQA,
  postQuestion,
  answerQuestion,
  upvoteQuestion,
  type QAQuestionWithMeta,
} from '@/lib/api/qa'

export function useQA(lessonId: string, sort: 'newest' | 'popular' = 'newest') {
  return useQuery({
    queryKey: ['qa', lessonId, sort],
    queryFn: () => listQA(lessonId, sort),
    enabled: !!lessonId,
  })
}

export function usePostQuestion(lessonId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { body: string }) => postQuestion(lessonId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa', lessonId] })
    },
  })
}

export function useAnswerQuestion(lessonId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, body }: { questionId: string; body: { text: string } }) =>
      answerQuestion(questionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa', lessonId] })
      qc.invalidateQueries({ queryKey: ['instructor', 'stats'] })
      qc.invalidateQueries({ queryKey: ['instructor', 'assignments'] })
    },
  })
}

export function useUpvoteQuestion(lessonId: string, sort: 'newest' | 'popular') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId }: { questionId: string }) => upvoteQuestion(questionId),
    onMutate: async ({ questionId }) => {
      await qc.cancelQueries({ queryKey: ['qa', lessonId, sort] })
      const previous = qc.getQueryData<QAQuestionWithMeta[]>(['qa', lessonId, sort])
      qc.setQueryData<QAQuestionWithMeta[]>(['qa', lessonId, sort], (old) =>
        old?.map((q) =>
          q.id === questionId
            ? {
                ...q,
                upvotes: q.hasUpvoted ? q.upvotes - 1 : q.upvotes + 1,
                hasUpvoted: !q.hasUpvoted,
              }
            : q,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['qa', lessonId, sort], ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['qa', lessonId, sort] })
    },
  })
}

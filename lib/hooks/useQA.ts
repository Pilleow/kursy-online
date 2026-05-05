import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listQA, postQuestion, answerQuestion, upvoteQuestion } from '@/lib/api/qa'

export function useQA(lessonId: string) {
  return useQuery({
    queryKey: ['qa', lessonId],
    queryFn: () => listQA(lessonId),
    enabled: !!lessonId,
  })
}

export function usePostQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, body }: { lessonId: string; body: { body: string } }) =>
      postQuestion(lessonId, body),
    onSuccess: (_, { lessonId }) => {
      qc.invalidateQueries({ queryKey: ['qa', lessonId] })
    },
  })
}

export function useAnswerQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, body }: { questionId: string; body: { answer: string } }) =>
      answerQuestion(questionId, body),
    onSuccess: (question) => {
      qc.invalidateQueries({ queryKey: ['qa', question.lessonId] })
    },
  })
}

export function useUpvoteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upvoteQuestion,
    onSuccess: (question) => {
      qc.invalidateQueries({ queryKey: ['qa', question.lessonId] })
    },
  })
}

import { z } from 'zod'

const QuestionTypeSchema = z.enum(['multiple_choice', 'true_false', 'short_answer'])

const QuizQuestionSchema = z.object({
  text: z.string().min(1),
  type: QuestionTypeSchema,
  options: z.array(z.string()),
  correctAnswer: z.string().optional(),
  points: z.number().int().positive().optional(),
})

export const QuizSchema = z.object({
  title: z.string().min(1).max(255),
  passingScore: z.number().min(0).max(100),
  cooldownMinutes: z.number().int().min(0).optional(),
  questions: z.array(QuizQuestionSchema).min(1),
})

export const AttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    })
  ),
})

export type QuizInput = z.infer<typeof QuizSchema>
export type AttemptInput = z.infer<typeof AttemptSchema>

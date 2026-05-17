import { z } from 'zod'

const HomeworkQuestionTypeSchema = z.enum(['text', 'file_upload', 'single_choice', 'multiple_choice'])

const HomeworkQuestionSchema = z.object({
  text: z.string().min(1),
  type: HomeworkQuestionTypeSchema,
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
})

export const HomeworkSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  questions: z.array(HomeworkQuestionSchema).min(1),
})

export const SubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    })
  ),
})

export const FeedbackSchema = z.object({
  feedback: z.string().min(1),
  score: z.number().min(0).max(100).optional(),
})

export type HomeworkInput = z.infer<typeof HomeworkSchema>
export type SubmissionInput = z.infer<typeof SubmissionSchema>
export type FeedbackInput = z.infer<typeof FeedbackSchema>

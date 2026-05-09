import { z } from 'zod'

const LessonTypeSchema = z.enum(['content', 'quiz', 'homework'])

export const CreateLessonSchema = z.object({
  title: z.string().min(1).max(255),
  type: LessonTypeSchema,
})

export const UpdateLessonSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'pending_review', 'published']).optional(),
  moduleId: z.string().min(1).optional(),
})

export const ReorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().min(1)).min(1),
})

const TextBlockSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  html: z.string(),
})

const VideoBlockSchema = z.object({
  type: z.literal('video'),
  id: z.string(),
  url: z.string().url(),
  durationS: z.number().positive().optional(),
  caption: z.string().optional(),
})

const QuizBlockSchema = z.object({
  type: z.literal('quiz'),
  id: z.string(),
  quizId: z.string(),
})

const HomeworkBlockSchema = z.object({
  type: z.literal('homework'),
  id: z.string(),
  homeworkId: z.string(),
})

const QASectionBlockSchema = z.object({
  type: z.literal('qa_section'),
  id: z.string(),
  prompt: z.string().optional(),
})

const BlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  VideoBlockSchema,
  QuizBlockSchema,
  HomeworkBlockSchema,
  QASectionBlockSchema,
])

export const BlocksSchema = z.array(BlockSchema)

export type CreateLessonInput = z.infer<typeof CreateLessonSchema>
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>
export type ReorderLessonsInput = z.infer<typeof ReorderLessonsSchema>
export type BlockInput = z.infer<typeof BlockSchema>
export type BlocksInput = z.infer<typeof BlocksSchema>

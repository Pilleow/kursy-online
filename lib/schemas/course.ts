import { z } from 'zod'

const CompletionRequirementsSchema = z.object({
  requireQuizPass: z.boolean().optional(),
  requireHomeworkSubmit: z.boolean().optional(),
  requireAllLessons: z.boolean().optional(),
})

export const CreateCourseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  accessDurationDays: z.number().int().positive().optional(),
})

export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const CourseSettingsSchema = z.object({
  price: z.number().min(0),
  currency: z.string().length(3),
  accessDurationDays: z.number().int().positive().optional(),
  completionRequirements: CompletionRequirementsSchema,
})

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>
export type CourseSettingsInput = z.infer<typeof CourseSettingsSchema>

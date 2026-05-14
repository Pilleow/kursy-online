import { z } from 'zod'

export const CreateEnrollmentSchema = z.object({
  courseId: z.string().min(1),
  couponCode: z.string().optional(),
})

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>

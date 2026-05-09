import { z } from 'zod'

export const CreateModuleSchema = z.object({
  title: z.string().min(1).max(255),
})

export const UpdateModuleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'pending_review', 'published']).optional(),
})

export const ReorderModulesSchema = z.object({
  moduleIds: z.array(z.string().min(1)).min(1),
})

export const ReplaceInstructorsSchema = z.object({
  instructorIds: z.array(z.string().min(1)),
})

export type CreateModuleInput = z.infer<typeof CreateModuleSchema>
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>
export type ReorderModulesInput = z.infer<typeof ReorderModulesSchema>
export type ReplaceInstructorsInput = z.infer<typeof ReplaceInstructorsSchema>

import { z } from 'zod'

export const SchoolSettingsSchema = z.object({
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
  customDomain: z.string().optional(),
  defaultLanguage: z.string().optional(),
  emailFrom: z.string().email().optional(),
  completionCriteria: z
    .object({
      requireQuizPass: z.boolean().optional(),
      requireHomeworkSubmit: z.boolean().optional(),
      requireAllLessons: z.boolean().optional(),
    })
    .optional(),
})

export const TranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  key: z.string().min(1),
  value: z.string().min(1),
})

export const CouponSchema = z.object({
  code: z.string().min(3).max(64),
  discountPct: z.number().min(1).max(100),
  courseId: z.string().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export const ApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  expiresAt: z.string().datetime().optional(),
})

export const MemberRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['school_admin', 'instructor', 'student']),
})

export type SchoolSettingsInput = z.infer<typeof SchoolSettingsSchema>
export type TranslationInput = z.infer<typeof TranslationSchema>
export type CouponInput = z.infer<typeof CouponSchema>
export type ApiKeyInput = z.infer<typeof ApiKeySchema>
export type MemberRoleInput = z.infer<typeof MemberRoleSchema>

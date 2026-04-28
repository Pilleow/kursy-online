export type PlanName = 'Starter' | 'Pro' | 'Enterprise'

export type Plan = {
  id: string
  name: PlanName
  maxCourses: number
  maxStudents: number
  maxStorageMb: number
  priceUsd: number
  createdAt: Date
  updatedAt: Date
}

export type SchoolSettings = {
  primaryColor?: string
  logoUrl?: string
  customDomain?: string
  defaultLanguage?: string
  emailFrom?: string
  completionCriteria?: {
    requireQuizPass?: boolean
    requireHomeworkSubmit?: boolean
    requireAllLessons?: boolean
  }
}

export type School = {
  id: string
  name: string
  slug: string
  planId: string
  settings: SchoolSettings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

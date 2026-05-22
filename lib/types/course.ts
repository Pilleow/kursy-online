export type CourseStatus = 'draft' | 'published' | 'archived'

export type CompletionRequirements = {
  requireQuizPass?: boolean
  requireHomeworkSubmit?: boolean
  requireAllLessons?: boolean
  minimumQuizScore?: number | null
}

export type Course = {
  id: string
  schoolId: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  status: CourseStatus
  priceUsd: number | null
  accessDurationDays: number | null
  completionRequirements: CompletionRequirements
  createdAt: Date
  updatedAt: Date
}

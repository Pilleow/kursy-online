export type HomeworkQuestionType = 'text' | 'file_upload'

export type HomeworkQuestion = {
  id: string
  homeworkId: string
  schoolId: string
  text: string
  type: HomeworkQuestionType
  position: number
  required: boolean
  createdAt: Date
  updatedAt: Date
}

export type Homework = {
  id: string
  lessonId: string
  schoolId: string
  title: string
  description: string | null
  dueAt: Date | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type HomeworkSubmission = {
  id: string
  homeworkId: string
  userId: string
  schoolId: string
  answers: Record<string, string>
  score: number | null
  feedback: string | null
  instructorId: string | null
  feedbackAt: Date | null
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

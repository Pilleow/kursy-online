export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

export type QuizQuestion = {
  id: string
  quizId: string
  schoolId: string
  text: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  position: number
  points: number
  createdAt: Date
  updatedAt: Date
}

export type Quiz = {
  id: string
  lessonId: string
  schoolId: string
  title: string
  passingScore: number
  cooldownMinutes: number
  createdAt: Date
  updatedAt: Date
}

export type QuizAttempt = {
  id: string
  quizId: string
  userId: string
  schoolId: string
  answers: Record<string, string>
  score: number
  passed: boolean
  startedAt: Date
  completedAt: Date | null
  createdAt: Date
}

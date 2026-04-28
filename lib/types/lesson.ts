export type ContentStatus = 'draft' | 'pending_review' | 'published'

export type LessonType = 'content' | 'quiz' | 'homework'

export type TextBlock = {
  type: 'text'
  id: string
  html: string
}

export type VideoBlock = {
  type: 'video'
  id: string
  url: string
  durationS?: number
  caption?: string
}

export type QuizBlock = {
  type: 'quiz'
  id: string
  quizId: string
}

export type HomeworkBlock = {
  type: 'homework'
  id: string
  homeworkId: string
}

export type QASectionBlock = {
  type: 'qa_section'
  id: string
  prompt?: string
}

export type Block = TextBlock | VideoBlock | QuizBlock | HomeworkBlock | QASectionBlock

export type Lesson = {
  id: string
  moduleId: string
  schoolId: string
  title: string
  position: number
  type: LessonType
  status: ContentStatus
  blocks: Block[]
  videoUrl: string | null
  durationS: number | null
  createdAt: Date
  updatedAt: Date
}

export type Module = {
  id: string
  courseId: string
  schoolId: string
  title: string
  position: number
  status: ContentStatus
  createdAt: Date
  updatedAt: Date
}

export type ModuleAssignment = {
  id: string
  moduleId: string
  instructorId: string
  schoolId: string
  createdAt: Date
}

export type SchoolRole = 'school_admin' | 'instructor' | 'student'

export type User = {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  isSystemAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export type SchoolMembership = {
  id: string
  schoolId: string
  userId: string
  role: SchoolRole
  createdAt: Date
  updatedAt: Date
}

export type Enrollment = {
  id: string
  courseId: string
  userId: string
  schoolId: string
  couponId: string | null
  pricePaid: number | null
  enrolledAt: Date
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type LessonProgress = {
  id: string
  lessonId: string
  userId: string
  schoolId: string
  completed: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type QAQuestion = {
  id: string
  lessonId: string
  userId: string
  schoolId: string
  body: string
  answer: string | null
  answeredById: string | null
  answeredAt: Date | null
  upvotes: number
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export type Certificate = {
  id: string
  userId: string
  courseId: string
  schoolId: string
  pdfUrl: string | null
  issuedAt: Date
  createdAt: Date
}

export type Coupon = {
  id: string
  schoolId: string
  courseId: string | null
  code: string
  discountPct: number
  maxUses: number | null
  usedCount: number
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ApiKey = {
  id: string
  schoolId: string
  name: string
  keyHash: string
  lastUsedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

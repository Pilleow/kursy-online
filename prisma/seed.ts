import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  // ── Reset ────────────────────────────────────────────────────────────────
  // Delete in dependency order (children before parents) to avoid FK violations.
  await db.homeworkSubmission.deleteMany()
  await db.homeworkQuestion.deleteMany()
  await db.homework.deleteMany()
  await db.quizAttempt.deleteMany()
  await db.quizQuestion.deleteMany()
  await db.quiz.deleteMany()
  await db.contentReview.deleteMany()
  await db.lessonProgress.deleteMany()
  await db.upvote.deleteMany()
  await db.qAQuestion.deleteMany()
  await db.lesson.deleteMany()
  await db.moduleAssignment.deleteMany()
  await db.module.deleteMany()
  await db.enrollment.deleteMany()
  await db.job.deleteMany()
  await db.coupon.deleteMany()
  await db.apiKey.deleteMany()
  await db.certificate.deleteMany()
  await db.course.deleteMany()
  await db.schoolMembership.deleteMany()
  await db.school.deleteMany()
  await db.user.deleteMany()
  await db.plan.deleteMany()

  // ── System Admin ─────────────────────────────────────────────────────────
  // Bootstrapped from env so credentials are never hard-coded in source.

  const sysEmail = process.env.SYSTEM_ADMIN_EMAIL ?? 'sysadmin@eduflow.dev'
  const sysPassword = process.env.SYSTEM_ADMIN_PASSWORD ?? 'changeme'
  const sysHash = await bcrypt.hash(sysPassword, 10)

  await db.user.upsert({
    where: { email: sysEmail },
    update: {},
    create: {
      email: sysEmail,
      passwordHash: sysHash,
      firstName: 'System',
      lastName: 'Admin',
      isSystemAdmin: true,
    },
  })

  // ── Plans ────────────────────────────────────────────────────────────────

  await db.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      maxCourses: 5,
      maxStudents: 100,
      maxStorageMb: 1024,
      priceUsd: 0,
    },
  })

  await db.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      maxCourses: 50,
      maxStudents: 1000,
      maxStorageMb: 10240,
      priceUsd: 49,
    },
  })

  const enterprise = await db.plan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      maxCourses: 999,
      maxStudents: 99999,
      maxStorageMb: 102400,
      priceUsd: 199,
    },
  })

  // ── Demo school ──────────────────────────────────────────────────────────

  const school = await db.school.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      slug: 'demo-school',
      planId: enterprise.id,
    },
  })

  // ── Users ────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await db.user.upsert({
    where: { email: 'a@e.com' },
    update: {},
    create: {
      email: 'a@e.com',
      passwordHash,
      firstName: 'Anna',
      lastName: 'Admin',
    },
  })

  const instructor = await db.user.upsert({
    where: { email: 'i@e.com' },
    update: {},
    create: {
      email: 'i@e.com',
      passwordHash,
      firstName: 'Ivan',
      lastName: 'Instructor',
    },
  })

  // ── Memberships ──────────────────────────────────────────────────────────

  await db.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: admin.id } },
    update: {},
    create: { schoolId: school.id, userId: admin.id, role: 'school_admin' },
  })

  await db.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: instructor.id } },
    update: {},
    create: { schoolId: school.id, userId: instructor.id, role: 'instructor' },
  })

  // ── Demo course + modules ────────────────────────────────────────────────

  const course = await db.course.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: 'intro-to-typescript' } },
    update: {},
    create: {
      schoolId: school.id,
      title: 'Intro to TypeScript',
      slug: 'intro-to-typescript',
      description: 'A hands-on TypeScript course for JavaScript developers.',
      status: 'published',
    },
  })

  const module1 = await db.module.upsert({
    where: { id: 'seed-module-1' },
    update: {},
    create: {
      id: 'seed-module-1',
      courseId: course.id,
      schoolId: school.id,
      title: 'Types & Interfaces',
      position: 1,
      status: 'published',
    },
  })

  const module2 = await db.module.upsert({
    where: { id: 'seed-module-2' },
    update: {},
    create: {
      id: 'seed-module-2',
      courseId: course.id,
      schoolId: school.id,
      title: 'Generics & Utility Types',
      position: 2,
      status: 'draft',
    },
  })

  // ── Lessons ──────────────────────────────────────────────────────────────

  const m1Lessons = [
    { id: 'seed-lesson-m1-1', title: 'What is TypeScript?', type: 'content', position: 1, status: 'published' },
    { id: 'seed-lesson-m1-2', title: 'Primitive Types', type: 'content', position: 2, status: 'published' },
    { id: 'seed-lesson-m1-3', title: 'Interfaces vs Type Aliases', type: 'content', position: 3, status: 'draft' },
    { id: 'seed-lesson-m1-4', title: 'Types Quiz', type: 'quiz', position: 4, status: 'draft' },
    { id: 'seed-lesson-m1-5', title: 'Types Homework', type: 'homework', position: 5, status: 'draft' },
  ] as const

  const m2Lessons = [
    { id: 'seed-lesson-m2-1', title: 'Introduction to Generics', type: 'content', position: 1, status: 'published' },
    { id: 'seed-lesson-m2-2', title: 'Utility Types: Partial & Required', type: 'content', position: 2, status: 'draft' },
    { id: 'seed-lesson-m2-3', title: 'Utility Types: Pick & Omit', type: 'content', position: 3, status: 'draft' },
    { id: 'seed-lesson-m2-4', title: 'Generics Quiz', type: 'quiz', position: 4, status: 'draft' },
  ] as const

  for (const l of m1Lessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: { ...l, moduleId: module1.id, schoolId: school.id },
    })
  }

  for (const l of m2Lessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: { ...l, moduleId: module2.id, schoolId: school.id },
    })
  }

  // ── Module assignments ───────────────────────────────────────────────────

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: module1.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: module1.id, instructorId: instructor.id, schoolId: school.id },
  })

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: module2.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: module2.id, instructorId: instructor.id, schoolId: school.id },
  })

  // ── Students + enrollments ───────────────────────────────────────────────

  const studentSeeds = [
    { email: 's1@e.com', firstName: 'Sara', lastName: 'Student', enroll: false },
    { email: 's2@e.com', firstName: 'Sam', lastName: 'Student', enroll: false },
    { email: 's3@e.com', firstName: 'Sofia', lastName: 'Student', enroll: true },
  ]

  for (const s of studentSeeds) {
    const student = await db.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, passwordHash, firstName: s.firstName, lastName: s.lastName },
    })

    await db.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId: school.id, userId: student.id } },
      update: {},
      create: { schoolId: school.id, userId: student.id, role: 'student' },
    })

    if (s.enroll) {
      await db.enrollment.upsert({
        where: { courseId_userId: { courseId: course.id, userId: student.id } },
        update: {},
        create: { courseId: course.id, userId: student.id, schoolId: school.id },
      })
    }
  }

  // ── Quizzes ──────────────────────────────────────────────────────────────

  const quizM1 = await db.quiz.upsert({
    where: { id: 'seed-quiz-m1' },
    update: {},
    create: {
      id: 'seed-quiz-m1',
      lessonId: 'seed-lesson-m1-4',
      schoolId: school.id,
      title: 'Types & Interfaces Quiz',
      cooldownMinutes: 30,
    },
  })

  const quizM1Questions = [
    {
      id: 'seed-qq-m1-1',
      text: 'Which keyword is used to define an interface in TypeScript?',
      type: 'multiple_choice' as const,
      options: ['type', 'interface', 'class', 'struct'],
      correctAnswer: 'interface',
      position: 1,
    },
    {
      id: 'seed-qq-m1-2',
      text: 'Can a TypeScript interface extend another interface?',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'true',
      position: 2,
    },
    {
      id: 'seed-qq-m1-3',
      text: 'Which utility type makes all properties of a type optional?',
      type: 'multiple_choice' as const,
      options: ['Required<T>', 'Readonly<T>', 'Partial<T>', 'Pick<T, K>'],
      correctAnswer: 'Partial<T>',
      position: 3,
    },
    {
      id: 'seed-qq-m1-4',
      text: 'Type aliases can represent union types but interfaces cannot.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'true',
      position: 4,
    },
  ]

  for (const q of quizM1Questions) {
    await db.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, quizId: quizM1.id, schoolId: school.id },
    })
  }

  const quizM2 = await db.quiz.upsert({
    where: { id: 'seed-quiz-m2' },
    update: {},
    create: {
      id: 'seed-quiz-m2',
      lessonId: 'seed-lesson-m2-4',
      schoolId: school.id,
      title: 'Generics & Utility Types Quiz',
      cooldownMinutes: 60,
    },
  })

  const quizM2Questions = [
    {
      id: 'seed-qq-m2-1',
      text: 'What does the generic parameter <T> represent in a function signature?',
      type: 'multiple_choice' as const,
      options: ['A fixed string type', 'A placeholder for any type supplied by the caller', 'A required class instance', 'An optional parameter'],
      correctAnswer: 'A placeholder for any type supplied by the caller',
      position: 1,
    },
    {
      id: 'seed-qq-m2-2',
      text: 'Which utility type constructs a type by picking a set of properties from another type?',
      type: 'multiple_choice' as const,
      options: ['Omit<T, K>', 'Pick<T, K>', 'Partial<T>', 'Exclude<T, U>'],
      correctAnswer: 'Pick<T, K>',
      position: 2,
    },
    {
      id: 'seed-qq-m2-3',
      text: 'Readonly<T> prevents reassignment of properties at compile time.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'true',
      position: 3,
    },
  ]

  for (const q of quizM2Questions) {
    await db.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, quizId: quizM2.id, schoolId: school.id },
    })
  }

  // ── Homework ─────────────────────────────────────────────────────────────

  const homework = await db.homework.upsert({
    where: { id: 'seed-homework-m1' },
    update: {},
    create: {
      id: 'seed-homework-m1',
      lessonId: 'seed-lesson-m1-5',
      schoolId: school.id,
      title: 'TypeScript Types Homework',
      description: 'Demonstrate your understanding of TypeScript types and interfaces by answering the questions below.',
    },
  })

  const homeworkQuestions = [
    {
      id: 'seed-hwq-1',
      text: 'Explain the difference between a type alias and an interface in TypeScript. When would you choose one over the other?',
      type: 'text' as const,
      position: 0,
      required: true,
    },
    {
      id: 'seed-hwq-2',
      text: 'Write a TypeScript interface for a User object with at least 3 fields. Include at least one optional field.',
      type: 'text' as const,
      position: 1,
      required: true,
    },
    {
      id: 'seed-hwq-3',
      text: 'Describe a real-world scenario where union types would be useful.',
      type: 'text' as const,
      position: 2,
      required: false,
    },
  ]

  for (const q of homeworkQuestions) {
    await db.homeworkQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, homeworkId: homework.id, schoolId: school.id },
    })
  }

  // ── Paid course ──────────────────────────────────────────────────────────

  const paidCourse = await db.course.upsert({
    where: { schoolId_slug: { schoolId: school.id, slug: 'advanced-react-patterns' } },
    update: {},
    create: {
      schoolId: school.id,
      title: 'Advanced React Patterns',
      slug: 'advanced-react-patterns',
      description: 'Master compound components, render props, custom hooks, and performance optimisation in React.',
      status: 'published',
      priceUsd: 79,
    },
  })

  const paidModule1 = await db.module.upsert({
    where: { id: 'seed-paid-module-1' },
    update: {},
    create: {
      id: 'seed-paid-module-1',
      courseId: paidCourse.id,
      schoolId: school.id,
      title: 'Compound Components',
      position: 1,
      status: 'published',
    },
  })

  const paidModule2 = await db.module.upsert({
    where: { id: 'seed-paid-module-2' },
    update: {},
    create: {
      id: 'seed-paid-module-2',
      courseId: paidCourse.id,
      schoolId: school.id,
      title: 'Performance & Memoization',
      position: 2,
      status: 'published',
    },
  })

  const paidLessons = [
    { id: 'seed-paid-lesson-1-1', moduleId: paidModule1.id, title: 'What are Compound Components?', type: 'content', position: 1, status: 'published' },
    { id: 'seed-paid-lesson-1-2', moduleId: paidModule1.id, title: 'Context + Compound Pattern', type: 'content', position: 2, status: 'published' },
    { id: 'seed-paid-lesson-1-3', moduleId: paidModule1.id, title: 'Compound Components Quiz', type: 'quiz', position: 3, status: 'published' },
    { id: 'seed-paid-lesson-2-1', moduleId: paidModule2.id, title: 'useMemo & useCallback', type: 'content', position: 1, status: 'published' },
    { id: 'seed-paid-lesson-2-2', moduleId: paidModule2.id, title: 'React.memo deep dive', type: 'content', position: 2, status: 'published' },
  ] as const

  for (const l of paidLessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: { id: l.id, moduleId: l.moduleId, schoolId: school.id, title: l.title, type: l.type, position: l.position, status: l.status },
    })
  }

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: paidModule1.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: paidModule1.id, instructorId: instructor.id, schoolId: school.id },
  })

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: paidModule2.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: paidModule2.id, instructorId: instructor.id, schoolId: school.id },
  })

  // Coupon valid for the paid course — 20 % off, unlimited uses
  await db.coupon.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'REACT20' } },
    update: {},
    create: {
      schoolId: school.id,
      courseId: paidCourse.id,
      code: 'REACT20',
      discountPct: 20,
    },
  })

  // Also a site-wide 10 % coupon (no courseId restriction) for checkout testing
  await db.coupon.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'WELCOME10' } },
    update: {},
    create: {
      schoolId: school.id,
      code: 'WELCOME10',
      discountPct: 10,
    },
  })

  // ── Review queue seed data ───────────────────────────────────────────────
  // Give lesson m1-3 some published blocks then a pending review with proposed edits.

  const publishedBlocks = [
    { type: 'text', id: 'blk-m1-3-1', html: '<p>TypeScript interfaces define the shape of an object.</p>' },
    { type: 'text', id: 'blk-m1-3-2', html: '<p>Type aliases can represent any type, not just objects.</p>' },
  ]

  const proposedBlocks = [
    { type: 'text', id: 'blk-m1-3-1', html: '<p>TypeScript interfaces define the shape of an object and support declaration merging.</p>' },
    { type: 'text', id: 'blk-m1-3-2', html: '<p>Type aliases can represent any type — primitives, unions, intersections, and objects.</p>' },
    { type: 'text', id: 'blk-m1-3-3', html: '<p>Rule of thumb: prefer <code>interface</code> for object shapes; use <code>type</code> for everything else.</p>' },
    { type: 'video', id: 'blk-m1-3-4', url: 'https://example.com/videos/interfaces-vs-types.mp4', caption: 'Interfaces vs Type Aliases — overview' },
  ]

  await db.lesson.update({
    where: { id: 'seed-lesson-m1-3' },
    data: { blocks: publishedBlocks, status: 'pending_review' },
  })

  await db.contentReview.upsert({
    where: { id: 'seed-review-1' },
    update: {},
    create: {
      id: 'seed-review-1',
      lessonId: 'seed-lesson-m1-3',
      courseId: course.id,
      schoolId: school.id,
      instructorId: instructor.id,
      changeSnapshot: proposedBlocks,
      status: 'pending',
    },
  })

  // Second pending review — new lesson content for m2-2
  const m2Lesson2PublishedBlocks = [
    { type: 'text', id: 'blk-m2-2-1', html: '<p>The <code>Partial</code> utility type makes all properties optional.</p>' },
  ]

  const m2Lesson2ProposedBlocks = [
    { type: 'text', id: 'blk-m2-2-1', html: '<p>The <code>Partial&lt;T&gt;</code> utility type makes all properties of T optional.</p>' },
    { type: 'text', id: 'blk-m2-2-2', html: '<p>The <code>Required&lt;T&gt;</code> utility type is the opposite — it makes all properties required.</p>' },
    { type: 'text', id: 'blk-m2-2-3', html: '<p>Both are commonly used when you want to accept partial updates in functions.</p>' },
  ]

  await db.lesson.update({
    where: { id: 'seed-lesson-m2-2' },
    data: { blocks: m2Lesson2PublishedBlocks, status: 'pending_review' },
  })

  await db.contentReview.upsert({
    where: { id: 'seed-review-2' },
    update: {},
    create: {
      id: 'seed-review-2',
      lessonId: 'seed-lesson-m2-2',
      courseId: course.id,
      schoolId: school.id,
      instructorId: instructor.id,
      changeSnapshot: m2Lesson2ProposedBlocks,
      status: 'pending',
    },
  })

  console.log(`
Seed complete.

  System:     ${sysEmail}  / ${sysPassword}  (isSystemAdmin=true)
  School:     Demo School  (id: ${school.id})
  Admin:      a@e.com  / password123
  Instructor: i@e.com  / password123
  Students:   s1@e.com, s2@e.com  / password123  (members, not enrolled)
              s3@e.com            / password123  (enrolled in free course)

  Free course:  Intro to TypeScript         /courses/intro-to-typescript
    Modules:    Types & Interfaces (${m1Lessons.length} lessons) | Generics & Utility Types (${m2Lessons.length} lessons)
    Quizzes:    seed-quiz-m1 (${quizM1Questions.length} questions, 30 min cooldown)
                seed-quiz-m2 (${quizM2Questions.length} questions, 60 min cooldown)
    Homework:   seed-homework-m1 (${homeworkQuestions.length} questions)
    Reviews:    2 pending (seed-review-1, seed-review-2)

  Paid course:  Advanced React Patterns  $79  /courses/advanced-react-patterns
    Modules:    Compound Components (3 lessons) | Performance & Memoization (2 lessons)
    Coupons:    REACT20  — 20% off (course-specific)
                WELCOME10 — 10% off (site-wide)
    Checkout:   /checkout/${paidCourse.id}
  `)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

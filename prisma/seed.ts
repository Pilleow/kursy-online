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

  // ── Quiz & homework lesson blocks ────────────────────────────────────────
  // These are set after the quiz/homework records exist so we have their IDs.
  // Each quiz/homework lesson must contain the matching block or the player shows "No content".

  // Placeholder updates — filled in below once quiz/homework IDs are known.

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

  // ── Module 3: Advanced Types ─────────────────────────────────────────────

  const module3 = await db.module.upsert({
    where: { id: 'seed-module-3' },
    update: {},
    create: {
      id: 'seed-module-3',
      courseId: course.id,
      schoolId: school.id,
      title: 'Advanced Types',
      position: 3,
      status: 'published',
    },
  })

  const m3Lessons = [
    { id: 'seed-lesson-m3-1', title: 'Union & Intersection Types', type: 'content', position: 1, status: 'published' },
    { id: 'seed-lesson-m3-2', title: 'Discriminated Unions', type: 'content', position: 2, status: 'published' },
    { id: 'seed-lesson-m3-3', title: 'Mapped Types', type: 'content', position: 3, status: 'published' },
    { id: 'seed-lesson-m3-4', title: 'Conditional Types', type: 'content', position: 4, status: 'published' },
    { id: 'seed-lesson-m3-5', title: 'Template Literal Types', type: 'content', position: 5, status: 'published' },
    { id: 'seed-lesson-m3-6', title: 'Advanced Types Quiz', type: 'quiz', position: 6, status: 'published' },
    { id: 'seed-lesson-m3-7', title: 'Advanced Types Homework', type: 'homework', position: 7, status: 'published' },
  ] as const

  for (const l of m3Lessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: { ...l, moduleId: module3.id, schoolId: school.id },
    })
  }

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-1' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m3-1-1', html: '<h2>Union Types</h2><p>A union type describes a value that can be one of several types. You use the pipe (<code>|</code>) operator to separate each type.</p><pre><code>type StringOrNumber = string | number;\n\nfunction format(value: StringOrNumber): string {\n  if (typeof value === "string") return value.toUpperCase();\n  return value.toFixed(2);\n}</code></pre>' },
        { type: 'text', id: 'blk-m3-1-2', html: '<h2>Intersection Types</h2><p>An intersection type combines multiple types into one using the <code>&amp;</code> operator. The resulting type has all the properties of every constituent type.</p><pre><code>type HasName = { name: string };\ntype HasAge  = { age: number };\ntype Person  = HasName &amp; HasAge; // { name: string; age: number }</code></pre>' },
        { type: 'text', id: 'blk-m3-1-3', html: '<h2>When to Use Each</h2><p><strong>Union</strong> — when a value can be <em>one of several</em> shapes (e.g. API response vs error).<br/><strong>Intersection</strong> — when you want to <em>merge</em> capabilities from several interfaces (e.g. mixins).</p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-2' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m3-2-1', html: '<h2>Discriminated Unions</h2><p>A discriminated union is a union type where every member shares a common literal property — the <em>discriminant</em>. TypeScript narrows the type automatically when you check the discriminant.</p>' },
        { type: 'text', id: 'blk-m3-2-2', html: '<pre><code>type Circle    = { kind: "circle";    radius: number };\ntype Rectangle = { kind: "rectangle"; width: number; height: number };\ntype Shape     = Circle | Rectangle;\n\nfunction area(shape: Shape): number {\n  switch (shape.kind) {\n    case "circle":    return Math.PI * shape.radius ** 2;\n    case "rectangle": return shape.width * shape.height;\n  }\n}</code></pre>' },
        { type: 'text', id: 'blk-m3-2-3', html: '<p>The compiler guarantees exhaustiveness: if you add a new variant to <code>Shape</code> and forget to handle it in the switch, you get a compile-time error.</p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-3' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m3-3-1', html: '<h2>Mapped Types</h2><p>Mapped types let you create new types by transforming each property in an existing type. They use the syntax <code>{ [K in keyof T]: ... }</code>.</p>' },
        { type: 'text', id: 'blk-m3-3-2', html: '<pre><code>type Readonly&lt;T&gt;  = { readonly [K in keyof T]: T[K] };\ntype Nullable&lt;T&gt;  = { [K in keyof T]: T[K] | null };\ntype Optional&lt;T&gt; = { [K in keyof T]?: T[K] };</code></pre>' },
        { type: 'text', id: 'blk-m3-3-3', html: '<p>Mapped types power most of the built-in utility types (<code>Partial</code>, <code>Required</code>, <code>Record</code>, etc.). They are one of the most powerful features for DRY type definitions.</p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-4' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m3-4-1', html: '<h2>Conditional Types</h2><p>Conditional types select one of two possible types based on a condition. The syntax mirrors a ternary expression: <code>T extends U ? X : Y</code>.</p>' },
        { type: 'text', id: 'blk-m3-4-2', html: '<pre><code>type IsArray&lt;T&gt; = T extends any[] ? true : false;\n\ntype A = IsArray&lt;string[]&gt;; // true\ntype B = IsArray&lt;number&gt;;   // false</code></pre>' },
        { type: 'text', id: 'blk-m3-4-3', html: '<h2>infer</h2><p>The <code>infer</code> keyword inside the extends clause lets you capture the matched type into a variable:</p><pre><code>type UnpackArray&lt;T&gt; = T extends (infer U)[] ? U : T;\n\ntype Unpacked = UnpackArray&lt;string[]&gt;; // string</code></pre>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-5' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m3-5-1', html: '<h2>Template Literal Types</h2><p>Introduced in TypeScript 4.1, template literal types let you construct new string literal types by embedding other types into template strings.</p>' },
        { type: 'text', id: 'blk-m3-5-2', html: '<pre><code>type Direction = "top" | "bottom" | "left" | "right";\ntype CSSMargin  = `margin-${Direction}`;\n// "margin-top" | "margin-bottom" | "margin-left" | "margin-right"</code></pre>' },
        { type: 'text', id: 'blk-m3-5-3', html: '<p>Combined with mapped types and <code>Capitalize</code> / <code>Lowercase</code> intrinsic helpers you can generate entire typed APIs from small sets of literal strings.</p>' },
      ],
    },
  })

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: module3.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: module3.id, instructorId: instructor.id, schoolId: school.id },
  })

  const quizM3 = await db.quiz.upsert({
    where: { id: 'seed-quiz-m3' },
    update: {},
    create: {
      id: 'seed-quiz-m3',
      lessonId: 'seed-lesson-m3-6',
      schoolId: school.id,
      title: 'Advanced Types Quiz',
      cooldownMinutes: 45,
    },
  })

  const quizM3Questions = [
    {
      id: 'seed-qq-m3-1',
      text: 'Which operator creates an intersection type in TypeScript?',
      type: 'multiple_choice' as const,
      options: ['|', '&', '+', '&&'],
      correctAnswer: '&',
      position: 1,
    },
    {
      id: 'seed-qq-m3-2',
      text: 'In a discriminated union, every member must share a common literal property.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'true',
      position: 2,
    },
    {
      id: 'seed-qq-m3-3',
      text: 'What TypeScript keyword is used to extract a type inside a conditional type expression?',
      type: 'multiple_choice' as const,
      options: ['extract', 'infer', 'typeof', 'keyof'],
      correctAnswer: 'infer',
      position: 3,
    },
    {
      id: 'seed-qq-m3-4',
      text: 'Template literal types were introduced in TypeScript 4.1.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'true',
      position: 4,
    },
    {
      id: 'seed-qq-m3-5',
      text: 'Which built-in utility type creates a new type by iterating over keys of an existing type?',
      type: 'multiple_choice' as const,
      options: ['Exclude<T, U>', 'Record<K, V>', 'Partial<T>', 'Extract<T, U>'],
      correctAnswer: 'Record<K, V>',
      position: 5,
    },
  ]

  for (const q of quizM3Questions) {
    await db.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, quizId: quizM3.id, schoolId: school.id },
    })
  }

  const homeworkM3 = await db.homework.upsert({
    where: { id: 'seed-homework-m3' },
    update: {},
    create: {
      id: 'seed-homework-m3',
      lessonId: 'seed-lesson-m3-7',
      schoolId: school.id,
      title: 'Advanced Types Homework',
      description: 'Apply your knowledge of union types, mapped types, and conditional types.',
    },
  })

  const homeworkM3Questions = [
    {
      id: 'seed-hwq-m3-1',
      text: 'Model an API response using a discriminated union with at least three variants (success, error, loading). Write the TypeScript types.',
      type: 'text' as const,
      position: 0,
      required: true,
    },
    {
      id: 'seed-hwq-m3-2',
      text: 'Write a generic mapped type called DeepReadonly<T> that makes all properties — including nested ones — readonly.',
      type: 'text' as const,
      position: 1,
      required: true,
    },
    {
      id: 'seed-hwq-m3-3',
      text: 'Which advanced type feature do you find most useful in real projects, and why?',
      type: 'text' as const,
      position: 2,
      required: false,
    },
  ]

  for (const q of homeworkM3Questions) {
    await db.homeworkQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, homeworkId: homeworkM3.id, schoolId: school.id },
    })
  }

  // ── Module 4: Functions & Classes ────────────────────────────────────────

  const module4 = await db.module.upsert({
    where: { id: 'seed-module-4' },
    update: {},
    create: {
      id: 'seed-module-4',
      courseId: course.id,
      schoolId: school.id,
      title: 'Functions & Classes',
      position: 4,
      status: 'published',
    },
  })

  const m4Lessons = [
    { id: 'seed-lesson-m4-1', title: 'Typing Functions', type: 'content', position: 1, status: 'published' },
    { id: 'seed-lesson-m4-2', title: 'Overloads & Rest Parameters', type: 'content', position: 2, status: 'published' },
    { id: 'seed-lesson-m4-3', title: 'Classes & Access Modifiers', type: 'content', position: 3, status: 'published' },
    { id: 'seed-lesson-m4-4', title: 'Abstract Classes & Implements', type: 'content', position: 4, status: 'published' },
    { id: 'seed-lesson-m4-5', title: 'Functions & Classes Quiz', type: 'quiz', position: 5, status: 'published' },
    { id: 'seed-lesson-m4-6', title: 'Functions & Classes Homework', type: 'homework', position: 6, status: 'published' },
  ] as const

  for (const l of m4Lessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: { ...l, moduleId: module4.id, schoolId: school.id },
    })
  }

  await db.lesson.update({
    where: { id: 'seed-lesson-m4-1' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m4-1-1', html: '<h2>Typing Function Parameters & Return Values</h2><p>TypeScript lets you annotate both parameters and the return type of a function. Return type annotations appear after the closing parenthesis.</p><pre><code>function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\n// Arrow function equivalent\nconst greet = (name: string): string =&gt; `Hello, ${name}!`;</code></pre>' },
        { type: 'text', id: 'blk-m4-1-2', html: '<h2>Optional & Default Parameters</h2><p>Add a <code>?</code> after the parameter name to make it optional. Provide a default value with <code>=</code> to skip the annotation entirely — TypeScript infers the type from the default.</p><pre><code>function connect(host: string, port = 5432, tls?: boolean) {\n  // port inferred as number, tls is boolean | undefined\n}</code></pre>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m4-2' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m4-2-1', html: '<h2>Function Overloads</h2><p>Overloads let you declare multiple call signatures for the same function. The implementation signature must be compatible with all overloads.</p><pre><code>function format(value: string): string;\nfunction format(value: number, decimals: number): string;\nfunction format(value: string | number, decimals = 0): string {\n  if (typeof value === "string") return value.trim();\n  return value.toFixed(decimals);\n}</code></pre>' },
        { type: 'text', id: 'blk-m4-2-2', html: '<h2>Rest Parameters</h2><p>Rest parameters collect an arbitrary number of trailing arguments into a typed array.</p><pre><code>function sum(...nums: number[]): number {\n  return nums.reduce((acc, n) =&gt; acc + n, 0);\n}</code></pre>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m4-3' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m4-3-1', html: '<h2>Classes in TypeScript</h2><p>TypeScript classes compile to plain ES6 classes but add static typing, access modifiers, and property declarations.</p><pre><code>class BankAccount {\n  private balance: number;\n\n  constructor(private owner: string, initial = 0) {\n    this.balance = initial;\n  }\n\n  deposit(amount: number): void {\n    this.balance += amount;\n  }\n\n  get currentBalance(): number {\n    return this.balance;\n  }\n}</code></pre>' },
        { type: 'text', id: 'blk-m4-3-2', html: '<h2>Access Modifiers</h2><p><code>public</code> (default) — accessible everywhere.<br/><code>private</code> — accessible only within the class.<br/><code>protected</code> — accessible within the class and subclasses.<br/><code>readonly</code> — can only be assigned in the constructor.</p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m4-4' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m4-4-1', html: '<h2>Abstract Classes</h2><p>An abstract class cannot be instantiated directly. It exists to define a common contract for its subclasses. Abstract methods must be implemented by every concrete subclass.</p><pre><code>abstract class Shape {\n  abstract area(): number;\n\n  describe(): string {\n    return `Area: ${this.area().toFixed(2)}`;\n  }\n}\n\nclass Circle extends Shape {\n  constructor(private radius: number) { super(); }\n  area() { return Math.PI * this.radius ** 2; }\n}</code></pre>' },
        { type: 'text', id: 'blk-m4-4-2', html: '<h2>implements vs extends</h2><p><code>implements</code> checks that a class satisfies an interface\'s shape but provides no implementation. <code>extends</code> inherits both type and implementation from a parent class. A class can <code>implement</code> multiple interfaces but can only <code>extend</code> one class.</p>' },
      ],
    },
  })

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: module4.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: module4.id, instructorId: instructor.id, schoolId: school.id },
  })

  const quizM4 = await db.quiz.upsert({
    where: { id: 'seed-quiz-m4' },
    update: {},
    create: {
      id: 'seed-quiz-m4',
      lessonId: 'seed-lesson-m4-5',
      schoolId: school.id,
      title: 'Functions & Classes Quiz',
      cooldownMinutes: 30,
    },
  })

  const quizM4Questions = [
    {
      id: 'seed-qq-m4-1',
      text: 'Which access modifier makes a class property visible only within the class itself?',
      type: 'multiple_choice' as const,
      options: ['public', 'protected', 'private', 'readonly'],
      correctAnswer: 'private',
      position: 1,
    },
    {
      id: 'seed-qq-m4-2',
      text: 'Can you instantiate an abstract class directly?',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'false',
      position: 2,
    },
    {
      id: 'seed-qq-m4-3',
      text: 'Function overloads in TypeScript require an implementation signature that is compatible with all overload signatures.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'true',
      position: 3,
    },
    {
      id: 'seed-qq-m4-4',
      text: 'How many classes can a TypeScript class extend at once?',
      type: 'multiple_choice' as const,
      options: ['Unlimited', 'Two', 'One', 'It depends on the target ES version'],
      correctAnswer: 'One',
      position: 4,
    },
  ]

  for (const q of quizM4Questions) {
    await db.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, quizId: quizM4.id, schoolId: school.id },
    })
  }

  const homeworkM4 = await db.homework.upsert({
    where: { id: 'seed-homework-m4' },
    update: {},
    create: {
      id: 'seed-homework-m4',
      lessonId: 'seed-lesson-m4-6',
      schoolId: school.id,
      title: 'Functions & Classes Homework',
      description: 'Design a class hierarchy and demonstrate function typing techniques.',
    },
  })

  const homeworkM4Questions = [
    {
      id: 'seed-hwq-m4-1',
      text: 'Design an abstract class Animal with an abstract method speak(). Create two concrete subclasses (e.g. Dog, Cat). Show the full TypeScript code.',
      type: 'text' as const,
      position: 0,
      required: true,
    },
    {
      id: 'seed-hwq-m4-2',
      text: 'Write a function with at least two overload signatures that accepts either a string or a number and returns a formatted result.',
      type: 'text' as const,
      position: 1,
      required: true,
    },
  ]

  for (const q of homeworkM4Questions) {
    await db.homeworkQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, homeworkId: homeworkM4.id, schoolId: school.id },
    })
  }

  // ── Module 5: Modules, Namespaces & Tooling ──────────────────────────────

  const module5 = await db.module.upsert({
    where: { id: 'seed-module-5' },
    update: {},
    create: {
      id: 'seed-module-5',
      courseId: course.id,
      schoolId: school.id,
      title: 'Modules, Namespaces & Tooling',
      position: 5,
      status: 'published',
    },
  })

  const m5Lessons = [
    { id: 'seed-lesson-m5-1', title: 'ES Modules in TypeScript', type: 'content', position: 1, status: 'published' },
    { id: 'seed-lesson-m5-2', title: 'Declaration Files (.d.ts)', type: 'content', position: 2, status: 'published' },
    { id: 'seed-lesson-m5-3', title: 'tsconfig.json Deep Dive', type: 'content', position: 3, status: 'published' },
    { id: 'seed-lesson-m5-4', title: 'TypeScript with Node & ESM', type: 'content', position: 4, status: 'published' },
    { id: 'seed-lesson-m5-5', title: 'Tooling Quiz', type: 'quiz', position: 5, status: 'published' },
  ] as const

  for (const l of m5Lessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: { ...l, moduleId: module5.id, schoolId: school.id },
    })
  }

  await db.lesson.update({
    where: { id: 'seed-lesson-m5-1' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m5-1-1', html: '<h2>ES Modules in TypeScript</h2><p>TypeScript supports the same <code>import</code>/<code>export</code> syntax as modern JavaScript. When you set <code>"module": "ESNext"</code> (or <code>"NodeNext"</code>) in tsconfig, the compiler emits native ES module syntax.</p><pre><code>// math.ts\nexport function add(a: number, b: number): number { return a + b; }\nexport const PI = 3.14159;\n\n// main.ts\nimport { add, PI } from "./math.js"; // note: .js extension for ESM</code></pre>' },
        { type: 'text', id: 'blk-m5-1-2', html: '<p>TypeScript re-exports, barrel files (<code>index.ts</code>), and type-only imports (<code>import type</code>) all work seamlessly with ES modules and are erased at compile time — they add zero runtime cost.</p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m5-2' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m5-2-1', html: '<h2>Declaration Files</h2><p>A <code>.d.ts</code> file contains only type information — no runtime code. TypeScript uses them to understand libraries that were written in plain JavaScript.</p><pre><code>// greet.d.ts\ndeclare function greet(name: string): string;\nexport { greet };</code></pre>' },
        { type: 'text', id: 'blk-m5-2-2', html: '<p>Most popular packages ship their own <code>.d.ts</code> files, or the community maintains them under <code>@types/*</code> on npm. When TypeScript cannot find types for a package, you can write a quick ambient declaration: <code>declare module "some-untyped-lib";</code></p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m5-3' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m5-3-1', html: '<h2>Key tsconfig Options</h2><ul><li><code>target</code> — which JS version to emit (<code>ES2020</code>, <code>ESNext</code>…)</li><li><code>module</code> — module system (<code>CommonJS</code>, <code>ESNext</code>, <code>NodeNext</code>…)</li><li><code>strict</code> — enables the full suite of strict checks (recommended)</li><li><code>outDir</code> — output directory for compiled files</li><li><code>rootDir</code> — root of your source tree</li><li><code>paths</code> — module path aliases (e.g. <code>@/</code> → <code>src/</code>)</li></ul>' },
        { type: 'text', id: 'blk-m5-3-2', html: '<p>The <code>strict</code> flag is a shorthand for enabling <code>strictNullChecks</code>, <code>noImplicitAny</code>, <code>strictFunctionTypes</code>, and several other checks. Always start a new project with <code>"strict": true</code>.</p>' },
      ],
    },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m5-4' },
    data: {
      blocks: [
        { type: 'text', id: 'blk-m5-4-1', html: '<h2>TypeScript with Node.js & ESM</h2><p>Set <code>"module": "NodeNext"</code> and <code>"moduleResolution": "NodeNext"</code> to get proper ESM output for Node 18+. Add <code>"type": "module"</code> in <code>package.json</code> and use the <code>.js</code> extension in your imports (TypeScript resolves the matching <code>.ts</code> file automatically).</p>' },
        { type: 'text', id: 'blk-m5-4-2', html: '<p>For rapid development, tools like <strong>tsx</strong> (<code>npx tsx src/index.ts</code>) run TypeScript files directly without a build step — ideal for scripts, CLIs, and local tooling.</p>' },
      ],
    },
  })

  await db.moduleAssignment.upsert({
    where: { moduleId_instructorId: { moduleId: module5.id, instructorId: instructor.id } },
    update: {},
    create: { moduleId: module5.id, instructorId: instructor.id, schoolId: school.id },
  })

  const quizM5 = await db.quiz.upsert({
    where: { id: 'seed-quiz-m5' },
    update: {},
    create: {
      id: 'seed-quiz-m5',
      lessonId: 'seed-lesson-m5-5',
      schoolId: school.id,
      title: 'Tooling Quiz',
      cooldownMinutes: 20,
    },
  })

  const quizM5Questions = [
    {
      id: 'seed-qq-m5-1',
      text: 'Which tsconfig option enables all strict type-checking features at once?',
      type: 'multiple_choice' as const,
      options: ['"noImplicitAny": true', '"strictNullChecks": true', '"strict": true', '"alwaysStrict": true'],
      correctAnswer: '"strict": true',
      position: 1,
    },
    {
      id: 'seed-qq-m5-2',
      text: 'Declaration files (.d.ts) contain runtime JavaScript code.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'false',
      position: 2,
    },
    {
      id: 'seed-qq-m5-3',
      text: 'What is the correct file extension to use in ESM imports when compiling with "moduleResolution": "NodeNext"?',
      type: 'multiple_choice' as const,
      options: ['.ts', '.tsx', '.js', 'No extension needed'],
      correctAnswer: '.js',
      position: 3,
    },
  ]

  for (const q of quizM5Questions) {
    await db.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, quizId: quizM5.id, schoolId: school.id },
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

  // ── Wire quiz/homework blocks into their lessons ─────────────────────────

  await db.lesson.update({
    where: { id: 'seed-lesson-m1-4' },
    data: { blocks: [{ type: 'quiz', id: 'blk-quiz-m1', quizId: quizM1.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m1-5' },
    data: { blocks: [{ type: 'homework', id: 'blk-hw-m1', homeworkId: homework.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m2-4' },
    data: { blocks: [{ type: 'quiz', id: 'blk-quiz-m2', quizId: quizM2.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-6' },
    data: { blocks: [{ type: 'quiz', id: 'blk-quiz-m3', quizId: quizM3.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m3-7' },
    data: { blocks: [{ type: 'homework', id: 'blk-hw-m3', homeworkId: homeworkM3.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m4-5' },
    data: { blocks: [{ type: 'quiz', id: 'blk-quiz-m4', quizId: quizM4.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m4-6' },
    data: { blocks: [{ type: 'homework', id: 'blk-hw-m4', homeworkId: homeworkM4.id }] },
  })

  await db.lesson.update({
    where: { id: 'seed-lesson-m5-5' },
    data: { blocks: [{ type: 'quiz', id: 'blk-quiz-m5', quizId: quizM5.id }] },
  })

  // Paid course quiz lesson block
  const paidQuiz = await db.quiz.upsert({
    where: { id: 'seed-quiz-paid-m1' },
    update: {},
    create: {
      id: 'seed-quiz-paid-m1',
      lessonId: 'seed-paid-lesson-1-3',
      schoolId: school.id,
      title: 'Compound Components Quiz',
      cooldownMinutes: 30,
    },
  })

  const paidQuizQuestions = [
    {
      id: 'seed-qq-paid-1',
      text: 'Which React hook is most commonly used to share state across compound components without prop drilling?',
      type: 'multiple_choice' as const,
      options: ['useState', 'useReducer', 'useContext', 'useRef'],
      correctAnswer: 'useContext',
      position: 1,
    },
    {
      id: 'seed-qq-paid-2',
      text: 'Compound components must always be direct children of the parent component.',
      type: 'true_false' as const,
      options: ['true', 'false'],
      correctAnswer: 'false',
      position: 2,
    },
  ]

  for (const q of paidQuizQuestions) {
    await db.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, quizId: paidQuiz.id, schoolId: school.id },
    })
  }

  await db.lesson.update({
    where: { id: 'seed-paid-lesson-1-3' },
    data: { blocks: [{ type: 'quiz', id: 'blk-quiz-paid-m1', quizId: paidQuiz.id }] },
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
    Modules:    Types & Interfaces (${m1Lessons.length} lessons)
                Generics & Utility Types (${m2Lessons.length} lessons)
                Advanced Types (${m3Lessons.length} lessons)
                Functions & Classes (${m4Lessons.length} lessons)
                Modules, Namespaces & Tooling (${m5Lessons.length} lessons)
    Quizzes:    seed-quiz-m1 (${quizM1Questions.length} questions, 30 min cooldown)
                seed-quiz-m2 (${quizM2Questions.length} questions, 60 min cooldown)
                seed-quiz-m3 (${quizM3Questions.length} questions, 45 min cooldown)
                seed-quiz-m4 (${quizM4Questions.length} questions, 30 min cooldown)
                seed-quiz-m5 (${quizM5Questions.length} questions, 20 min cooldown)
    Homework:   seed-homework-m1 (${homeworkQuestions.length} questions)
                seed-homework-m3 (${homeworkM3Questions.length} questions)
                seed-homework-m4 (${homeworkM4Questions.length} questions)
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

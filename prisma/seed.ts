import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
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
    where: { email: 'admin@demo.school' },
    update: {},
    create: {
      email: 'admin@demo.school',
      passwordHash,
      firstName: 'Anna',
      lastName: 'Admin',
    },
  })

  const instructor = await db.user.upsert({
    where: { email: 'instructor@demo.school' },
    update: {},
    create: {
      email: 'instructor@demo.school',
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

  console.log(`
Seed complete.

  System:     ${sysEmail}  / ${sysPassword}  (isSystemAdmin=true)
  School:     Demo School  (id: ${school.id})
  Admin:      admin@demo.school       / password123
  Instructor: instructor@demo.school  / password123
  Course:     Intro to TypeScript
  Modules:    Types & Interfaces | Generics & Utility Types
  `)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

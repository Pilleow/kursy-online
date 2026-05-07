import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
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

  await db.plan.upsert({
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

  console.log('Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

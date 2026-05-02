import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/server/db'
import { withLogging } from '@/lib/server/middleware/withLogging'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  schoolName: z.string().min(1).optional(),
})

async function handler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null)
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { email, password, firstName, lastName, schoolName } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already taken' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  if (schoolName) {
    const plan = await db.plan.findFirst({ where: { name: 'Starter' } })
    if (!plan) {
      return NextResponse.json({ error: 'Default plan not found' }, { status: 500 })
    }

    const slug = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const uniqueSlug = `${slug}-${Date.now()}`

    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, passwordHash, firstName, lastName },
      })

      const school = await tx.school.create({
        data: { name: schoolName, slug: uniqueSlug, planId: plan.id },
      })

      await tx.schoolMembership.create({
        data: { userId: createdUser.id, schoolId: school.id, role: 'school_admin' },
      })

      return createdUser
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 },
    )
  }

  const user = await db.user.create({
    data: { email, passwordHash, firstName, lastName },
  })

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    },
    { status: 201 },
  )
}

export const POST = withLogging(handler)

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { z } from 'zod'

const InviteSchema = z.object({ email: z.string().email() })

const postHandler: TenantHandler = async (req: NextRequest, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email } = parsed.data

  const user = await tx.user.findUnique({ where: { email } })

  if (!user) {
    // TODO: send invitation email via Nodemailer/Resend to invite user to create an account
    console.log(`[TODO] Send instructor invitation email to: ${email} (school: ${schoolId})`)
    return NextResponse.json({ status: 'invited', message: 'Invitation email queued (stub)' })
  }

  const existing = await tx.schoolMembership.findUnique({
    where: { schoolId_userId: { schoolId, userId: user.id } },
  })

  if (existing) {
    if (existing.role === 'instructor') {
      return NextResponse.json({ error: 'User is already an instructor in this school' }, { status: 409 })
    }
    const updated = await tx.schoolMembership.update({
      where: { schoolId_userId: { schoolId, userId: user.id } },
      data: { role: 'instructor' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    })
    return NextResponse.json({ status: 'promoted', member: updated })
  }

  const membership = await tx.schoolMembership.create({
    data: { schoolId, userId: user.id, role: 'instructor' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })
  return NextResponse.json({ status: 'added', member: membership }, { status: 201 })
}

export const POST = withLogging(compose('school_admin')(postHandler))

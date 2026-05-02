import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/server/db'
import { signAccessToken, signRefreshToken } from '@/lib/server/jwt'
import { withLogging } from '@/lib/server/middleware/withLogging'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60

async function handler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { email, password } = parsed.data

  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { take: 1 } },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const membership = user.memberships[0] ?? null
  const tokenPayload = {
    sub: user.id,
    schoolId: membership?.schoolId ?? null,
    role: membership?.role ?? null,
    isSystemAdmin: user.isSystemAdmin,
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ])

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      schoolId: membership?.schoolId ?? null,
      role: membership?.role ?? null,
    },
  })

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_TTL_SECONDS,
  })

  return response
}

export const POST = withLogging(handler)

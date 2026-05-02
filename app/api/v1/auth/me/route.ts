import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/server/jwt'
import { redis } from '@/lib/server/redis'
import { db } from '@/lib/server/db'
import { withLogging } from '@/lib/server/middleware/withLogging'

async function handler(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 })
  }

  let payload
  try {
    payload = await verifyToken(token)
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  if (payload.jti) {
    const blocked = await redis.get(`blocklist:${payload.jti}`)
    if (blocked) {
      return NextResponse.json({ error: 'Token has been revoked' }, { status: 401 })
    }
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: {
      memberships: payload.schoolId
        ? { where: { schoolId: payload.schoolId }, take: 1 }
        : { take: 1 },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const membership = user.memberships[0] ?? null

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isSystemAdmin: user.isSystemAdmin,
      createdAt: user.createdAt,
    },
    membership: membership
      ? {
          id: membership.id,
          schoolId: membership.schoolId,
          role: membership.role,
        }
      : null,
  })
}

export const GET = withLogging(handler)

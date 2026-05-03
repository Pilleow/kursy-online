import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/server/jwt'
import { redis } from '@/lib/server/redis'
import { db } from '@/lib/server/db'
import { verifyApiKey } from '@/lib/server/apiKey'
import { withLogging } from '@/lib/server/middleware/withLogging'

async function handler(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
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

  // API key path: X-API-Key: <keyId>.<rawSecret>
  const apiKeyHeader = req.headers.get('x-api-key')
  if (apiKeyHeader) {
    const dot = apiKeyHeader.indexOf('.')
    if (dot < 1) {
      return NextResponse.json({ error: 'Malformed API key' }, { status: 401 })
    }

    const keyId = apiKeyHeader.slice(0, dot)
    const record = await db.apiKey.findUnique({ where: { id: keyId } })

    if (!record) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'API key expired' }, { status: 401 })
    }

    const valid = await verifyApiKey(apiKeyHeader, record.schoolId)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    db.apiKey
      .update({ where: { id: keyId }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined)

    return NextResponse.json({
      user: null,
      membership: null,
      apiKey: {
        schoolId: record.schoolId,
        name: record.name,
      },
    })
  }

  return NextResponse.json({ error: 'Missing authentication' }, { status: 401 })
}

export const GET = withLogging(handler)

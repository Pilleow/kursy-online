import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/server/jwt'
import { redis } from '@/lib/server/redis'
import { db } from '@/lib/server/db'
import type { SchoolRole } from '@/lib/types/user'

export interface AuthContext {
  /** null when authenticated via API key (no user identity) */
  userId: string | null
  schoolId: string | null
  role: SchoolRole | null
  isSystemAdmin: boolean
}

export type AuthedHandler<TCtx extends AuthContext = AuthContext> = (
  req: NextRequest,
  ctx: TCtx,
) => Promise<NextResponse>

/**
 * Verifies either Authorization: Bearer <JWT> or X-API-Key: <id>.<rawKey>.
 * JWT path: checks jti against Redis blocklist (403 if blocked).
 * API key path: looks up ApiKey record by id, compares hash with bcryptjs.
 * Attaches identity to ctx passed to the inner handler.
 */
export function withAuth<TCtx extends AuthContext>(
  handler: AuthedHandler<TCtx>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      let payload: Awaited<ReturnType<typeof verifyToken>>

      try {
        payload = await verifyToken(token)
      } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      }

      const blocked = await redis.get(`blocklist:${payload.jti}`)
      if (blocked) {
        return NextResponse.json({ error: 'Token has been revoked' }, { status: 401 })
      }

      // System admins operate across all schools — strip any school-scoped claims
      // from their token so downstream handlers cannot accidentally trust them.
      const isSystemAdmin = payload.isSystemAdmin === true
      const ctx = {
        userId: payload.sub,
        schoolId: isSystemAdmin ? null : payload.schoolId,
        role: isSystemAdmin ? null : payload.role,
        isSystemAdmin,
      } as TCtx

      return handler(req, ctx)
    }

    // API key format: "<keyId>.<rawSecret>"
    // The keyId lets us do a direct DB lookup before the expensive bcrypt compare.
    const apiKeyHeader = req.headers.get('x-api-key')
    if (apiKeyHeader) {
      const dotIndex = apiKeyHeader.indexOf('.')
      if (dotIndex < 1) {
        return NextResponse.json({ error: 'Malformed API key' }, { status: 401 })
      }

      const keyId = apiKeyHeader.slice(0, dotIndex)
      const rawKey = apiKeyHeader.slice(dotIndex + 1)

      const apiKey = await db.apiKey.findUnique({ where: { id: keyId } })

      if (!apiKey) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return NextResponse.json({ error: 'API key expired' }, { status: 401 })
      }

      const valid = await bcrypt.compare(rawKey, apiKey.keyHash)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }

      // Fire-and-forget; non-critical, must not block response
      db.apiKey
        .update({ where: { id: keyId }, data: { lastUsedAt: new Date() } })
        .catch(() => undefined)

      const ctx = {
        userId: null,
        schoolId: apiKey.schoolId,
        role: null,
        isSystemAdmin: false,
      } as TCtx

      return handler(req, ctx)
    }

    return NextResponse.json({ error: 'Missing authentication' }, { status: 401 })
  }
}

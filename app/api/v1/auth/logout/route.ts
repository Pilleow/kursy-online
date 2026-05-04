import { type NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/server/jwt'
import { redis } from '@/lib/server/redis'
import { withLogging } from '@/lib/server/middleware/withLogging'

async function handler(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    try {
      const payload = await verifyToken(token)
      if (payload.jti && payload.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000)
        if (ttl > 0) {
          await redis.set(`blocklist:${payload.jti}`, '1', 'EX', ttl)
        }
      }
    } catch {
      // token already invalid — proceed with cookie clear
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })

  return response
}

export const POST = withLogging(handler)

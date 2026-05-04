import { type NextRequest, NextResponse } from 'next/server'
import { verifyToken, signAccessToken } from '@/lib/server/jwt'
import { withLogging } from '@/lib/server/middleware/withLogging'

async function handler(req: NextRequest): Promise<NextResponse> {
  const refreshToken = req.cookies.get('refresh_token')?.value
  if (!refreshToken) {
    return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 })
  }

  let payload
  try {
    payload = await verifyToken(refreshToken)
  } catch {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
  }

  const accessToken = await signAccessToken({
    sub: payload.sub,
    schoolId: payload.schoolId,
    role: payload.role,
    isSystemAdmin: payload.isSystemAdmin,
  })

  return NextResponse.json({ accessToken })
}

export const POST = withLogging(handler)

import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import type { SchoolRole } from '@/lib/types/user'

export interface AccessTokenPayload {
  sub: string
  schoolId: string | null
  role: SchoolRole | null
  jti: string
  isSystemAdmin: boolean
  exp?: number
}

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-me',
)

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'jti'>): Promise<string> {
  return new SignJWT({ ...payload, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret)
}

export async function signRefreshToken(payload: Omit<AccessTokenPayload, 'jti'>): Promise<string> {
  return new SignJWT({ ...payload, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as AccessTokenPayload
}

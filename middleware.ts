import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_EXACT = new Set(['/', '/login', '/register'])

const PUBLIC_PREFIXES = ['/courses', '/checkout', '/api/v1/auth']

const PROTECTED_EXACT = new Set(['/dashboard', '/profile'])

const PROTECTED_PREFIXES = ['/admin', '/instructor', '/learn', '/certificates']

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function isProtected(pathname: string): boolean {
  if (PROTECTED_EXACT.has(pathname)) return true
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

async function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get('refresh_token')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-me',
    )
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const payload = await getTokenPayload(req)

  // /system/* — requires isSystemAdmin flag
  if (pathname === '/system' || pathname.startsWith('/system/')) {
    if (!payload?.isSystemAdmin) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Role-protected routes — require any valid session
  if (isProtected(pathname) && !payload) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif\\.webp)$).*)',
  ],
}

import { getToken } from 'next-auth/jwt'
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const token = await getToken({
    req,
    cookieName: 'refresh_token',
    secret: process.env.NEXTAUTH_SECRET,
  })

  // /system/* — requires isSystemAdmin flag
  if (pathname === '/system' || pathname.startsWith('/system/')) {
    if (!token?.isSystemAdmin) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Role-protected routes — require any valid session
  if (isProtected(pathname) && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

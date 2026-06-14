import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withAuth } from './withAuth'
import type { AuthContext, AuthedHandler } from './withAuth'

export function withSystemAdmin(
  handler: AuthedHandler<AuthContext>,
): (req: NextRequest) => Promise<NextResponse> {
  return withAuth(async (req: NextRequest, ctx: AuthContext) => {
    if (!ctx.isSystemAdmin) {
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 })
    }
    return handler(req, ctx)
  })
}

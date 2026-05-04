import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import type { SchoolRole } from '@/lib/types/user'
import type { AuthContext } from './withAuth'
import type { TenantContext, TenantHandler } from './withTenant'
import { withAuth } from './withAuth'
import { withTenant } from './withTenant'

/** Higher number = higher privilege. */
const ROLE_RANK: Record<SchoolRole, number> = {
  school_admin: 3,
  instructor: 2,
  student: 1,
}

/**
 * Factory that returns a middleware enforcing a minimum role.
 * System admins bypass the role check entirely.
 *
 * @param minRole  Lowest acceptable role in the hierarchy: school_admin > instructor > student
 */
export function withRole(minRole: SchoolRole) {
  return (handler: TenantHandler): TenantHandler => {
    return async (req: NextRequest, ctx: TenantContext): Promise<NextResponse> => {
      if (!ctx.isSystemAdmin) {
        if (!ctx.role || ROLE_RANK[ctx.role] < ROLE_RANK[minRole]) {
          return NextResponse.json(
            { error: `Requires role '${minRole}' or higher` },
            { status: 403 },
          )
        }
      }

      return handler(req, ctx)
    }
  }
}

/**
 * Chains withAuth → withTenant → withRole(minRole) into a single wrapper.
 *
 * Usage:
 * ```ts
 * export const GET = compose('instructor')(async (req, ctx) => {
 *   const courses = await ctx.tx.course.findMany(...)
 *   return NextResponse.json(courses)
 * })
 * ```
 */
export function compose(minRole: SchoolRole) {
  return (handler: TenantHandler): ((req: NextRequest) => Promise<NextResponse>) => {
    return withAuth<AuthContext>(withTenant(withRole(minRole)(handler)))
  }
}

export type { TenantContext, TenantHandler }

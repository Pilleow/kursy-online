import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import type { Prisma } from '@/src/generated/prisma/client'
import type { AuthContext, AuthedHandler } from './withAuth'

export interface TenantContext extends Omit<AuthContext, 'schoolId'> {
  /** Guaranteed non-null: withTenant rejects requests without a school context. */
  schoolId: string
  /** Prisma transaction client. All DB calls inside the handler MUST use tx
   *  so that SET LOCAL app.school_id (RLS) remains in scope. */
  tx: Prisma.TransactionClient
}

export type TenantHandler = (req: NextRequest, ctx: TenantContext) => Promise<NextResponse>

/**
 * Opens a Prisma transaction, activates PostgreSQL RLS by setting
 * app.school_id = schoolId for the duration of the transaction, then calls
 * the inner handler with the transaction client attached to ctx.
 *
 * Must be used after withAuth so that ctx.schoolId is already populated.
 */
export function withTenant(handler: TenantHandler): AuthedHandler {
  return async (req: NextRequest, ctx: AuthContext): Promise<NextResponse> => {
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'School context required' }, { status: 400 })
    }

    const schoolId = ctx.schoolId

    return db.$transaction(async (tx) => {
      // set_config(key, value, is_local=true) scopes the value to the current transaction.
      // RLS policies on tenant tables read current_setting('app.school_id').
      await tx.$executeRaw`SELECT set_config('app.school_id', ${schoolId}, true)`

      return handler(req, { ...ctx, schoolId, tx })
    })
  }
}

import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'

function getMemberUserId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('members')
  return segments[idx + 1] ?? ''
}

const deleteHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId: requesterId } = ctx
  const targetUserId = getMemberUserId(req)

  if (targetUserId === requesterId) {
    return NextResponse.json({ error: 'Cannot remove yourself from the school' }, { status: 422 })
  }

  const membership = await tx.schoolMembership.findUnique({
    where: { schoolId_userId: { schoolId, userId: targetUserId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  await tx.schoolMembership.delete({
    where: { schoolId_userId: { schoolId, userId: targetUserId } },
  })

  return new NextResponse(null, { status: 204 })
}

export const DELETE = withLogging(compose('school_admin')(deleteHandler))

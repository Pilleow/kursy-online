import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth, type AuthedHandler } from '@/lib/server/middleware/withAuth'
import { db } from '@/lib/server/db'

function getJobId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('jobs')
  return segments[idx + 1] ?? ''
}

const getHandler: AuthedHandler = async (req, ctx) => {
  const { userId, role, isSystemAdmin } = ctx
  const jobId = getJobId(req)

  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const isOwner = userId != null && job.userId === userId
  const isAdmin = isSystemAdmin || role === 'school_admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: (job.result as Record<string, unknown> | null)?.progress ?? null,
    resultUrl: (job.result as Record<string, unknown> | null)?.resultUrl ?? null,
    errorMessage: job.error,
    createdAt: job.createdAt,
    completedAt: job.doneAt,
  })
}

export const GET = withLogging(withAuth(getHandler))

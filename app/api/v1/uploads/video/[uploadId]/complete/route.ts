import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth, type AuthedHandler } from '@/lib/server/middleware/withAuth'
import { db } from '@/lib/server/db'
import { videoQueue } from '@/lib/server/queue'

const ROLE_RANK = { school_admin: 3, instructor: 2, student: 1 } as const

function getUploadId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('video')
  return segments[idx + 1] ?? ''
}

const postHandler: AuthedHandler = async (req, ctx) => {
  const { schoolId, role, isSystemAdmin } = ctx

  if (!isSystemAdmin) {
    if (!role || ROLE_RANK[role] < ROLE_RANK['instructor']) {
      return NextResponse.json({ error: "Requires role 'instructor' or higher" }, { status: 403 })
    }
  }

  if (!schoolId) {
    return NextResponse.json({ error: 'School context required' }, { status: 400 })
  }

  const uploadId = getUploadId(req)

  const upload = await db.videoUpload.findFirst({
    where: { id: uploadId, schoolId },
  })
  if (!upload) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
  }

  // Update commits immediately (no open transaction) so the worker always
  // sees 'processing' status when it picks up the job below.
  await db.videoUpload.update({
    where: { id: uploadId },
    data: { status: 'processing' },
  })

  const job = await videoQueue.add('process', {
    uploadId: upload.id,
    s3Key: upload.s3Key,
    schoolId: upload.schoolId,
  })

  return NextResponse.json({ jobId: job.id })
}

export const POST = withLogging(withAuth(postHandler))

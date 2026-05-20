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
  const { userId, schoolId, role, isSystemAdmin } = ctx

  if (!isSystemAdmin) {
    if (!role || ROLE_RANK[role] < ROLE_RANK['instructor']) {
      return NextResponse.json({ error: "Requires role 'instructor' or higher" }, { status: 403 })
    }
  }

  if (!schoolId || !userId) {
    return NextResponse.json({ error: 'School context required' }, { status: 400 })
  }

  const uploadId = getUploadId(req)

  const upload = await db.videoUpload.findFirst({
    where: { id: uploadId, schoolId },
  })
  if (!upload) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
  }

  // Create the DB job record first so the polling endpoint has something to return.
  const dbJob = await db.job.create({
    data: {
      schoolId,
      userId,
      type: 'video_processing',
      status: 'pending',
      payload: { uploadId: upload.id, s3Key: upload.s3Key },
    },
  })

  await db.videoUpload.update({
    where: { id: uploadId },
    data: { status: 'processing' },
  })

  await videoQueue.add('process', {
    uploadId: upload.id,
    s3Key: upload.s3Key,
    schoolId: upload.schoolId,
    dbJobId: dbJob.id,
  })

  return NextResponse.json({ jobId: dbJob.id })
}

export const POST = withLogging(withAuth(postHandler))

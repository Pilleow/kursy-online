import 'server-only'

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { getPresignedUploadUrl } from '@/lib/server/storage'

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { fileName, fileSize, mimeType } = body as Record<string, unknown>

  if (typeof fileName !== 'string' || !fileName) {
    return NextResponse.json({ error: "'fileName' is required" }, { status: 400 })
  }
  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return NextResponse.json({ error: "'fileSize' must be a positive number" }, { status: 400 })
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return NextResponse.json(
      { error: `'mimeType' must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` },
      { status: 400 },
    )
  }

  const s3Key = `schools/${schoolId}/videos/${randomUUID()}/${fileName}`

  const presignedUrl = await getPresignedUploadUrl(s3Key, mimeType as string, 3600)

  const upload = await tx.videoUpload.create({
    data: { schoolId, s3Key, fileName, mimeType: mimeType as string, fileSize },
  })

  return NextResponse.json({ uploadId: upload.id, presignedUrl }, { status: 201 })
}

export const POST = withLogging(compose('instructor')(postHandler))

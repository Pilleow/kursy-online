import 'server-only'

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
  },
})

// S3_PUBLIC_ENDPOINT is the URL browsers use to reach the object store.
// In Docker Compose it differs from S3_ENDPOINT (internal hostname).
// Falls back to S3_ENDPOINT when both are the same (local dev without Docker).
const publicEndpoint = (process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT ?? '').replace(/\/$/, '')
const bucket = process.env.S3_BUCKET ?? 'eduflow'

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const internalUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  )
  // Rewrite the host portion so the URL is browser-reachable.
  if (publicEndpoint && process.env.S3_ENDPOINT && publicEndpoint !== process.env.S3_ENDPOINT.replace(/\/$/, '')) {
    return internalUrl.replace(process.env.S3_ENDPOINT.replace(/\/$/, ''), publicEndpoint)
  }
  return internalUrl
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
  contentDisposition?: string,
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(contentDisposition ? { ResponseContentDisposition: contentDisposition } : {}),
  })
  const internalUrl = await getSignedUrl(s3, cmd, { expiresIn })
  if (publicEndpoint && process.env.S3_ENDPOINT && publicEndpoint !== process.env.S3_ENDPOINT.replace(/\/$/, '')) {
    return internalUrl.replace(process.env.S3_ENDPOINT.replace(/\/$/, ''), publicEndpoint)
  }
  return internalUrl
}

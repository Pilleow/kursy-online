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

const publicEndpoint = (process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT ?? '').replace(/\/$/, '')
const bucket = process.env.S3_BUCKET ?? 'ngv'

function rewriteToPublic(url: string): string {
  const internalBase = process.env.S3_ENDPOINT?.replace(/\/$/, '')
  if (publicEndpoint && internalBase && publicEndpoint !== internalBase) {
    return url.replace(internalBase, publicEndpoint)
  }
  return url
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  )
  return rewriteToPublic(url)
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
  contentDisposition?: string,
): Promise<string> {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(contentDisposition ? { ResponseContentDisposition: contentDisposition } : {}),
    }),
    { expiresIn },
  )
  return rewriteToPublic(url)
}

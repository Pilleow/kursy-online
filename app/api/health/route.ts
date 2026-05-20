import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { db } from '@/lib/server/db'
import { redis } from '@/lib/server/redis'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
  },
})

const bucket = process.env.S3_BUCKET ?? 'ngv'

export async function GET() {
  const [dbResult, redisResult, storageResult] = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.ping(),
    s3.send(new HeadBucketCommand({ Bucket: bucket })),
  ])

  const dbStatus = dbResult.status === 'fulfilled' ? 'ok' : 'error'
  const redisStatus = redisResult.status === 'fulfilled' ? 'ok' : 'error'
  const storageStatus = storageResult.status === 'fulfilled' ? 'ok' : 'error'

  const allOk = dbStatus === 'ok' && redisStatus === 'ok' && storageStatus === 'ok'

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      storage: storageStatus,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  )
}

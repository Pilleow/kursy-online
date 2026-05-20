import { Worker, type Job } from 'bullmq'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import type {
  CertificateJobData,
  VideoJobData,
  DuplicationJobData,
  EmailDigestJobData,
} from '../lib/server/queue'

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
  maxRetriesPerRequest: null,
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

function makeWorker<T>(queueName: string): Worker<T> {
  return new Worker<T>(
    queueName,
    async (job: Job<T>) => {
      console.log(`[${queueName}] processing job ${job.id}`, job.data)
    },
    { connection }
  )
}

async function markJobDone(dbJobId: string) {
  await prisma.job.updateMany({
    where: { id: dbJobId },
    data: { status: 'completed', doneAt: new Date() },
  })
}

const duplicationWorker = new Worker<DuplicationJobData>(
  'course-duplication',
  async (job: Job<DuplicationJobData>) => {
    console.log(`[course-duplication] processing job ${job.id}`, job.data)
    await markJobDone(job.name)
    console.log(`[course-duplication] job ${job.id} completed`)
  },
  { connection }
)

const certificateWorker = new Worker<CertificateJobData>(
  'certificate-generation',
  async (job: Job<CertificateJobData>) => {
    console.log(`[certificate-generation] processing job ${job.id}`, job.data)

    const { certificateId } = job.data
    const pdfKey = `certificates/${certificateId}.pdf`

    await prisma.certificate.updateMany({
      where: { id: certificateId },
      data: { pdfUrl: pdfKey },
    })
    await markJobDone(job.name)

    console.log(`[certificate-generation] job ${job.id} completed — pdfUrl: ${pdfKey}`)
  },
  { connection }
)

const videoWorker = new Worker<VideoJobData>(
  'video-processing',
  async (job: Job<VideoJobData>) => {
    const { uploadId, s3Key, schoolId, dbJobId } = job.data
    console.log(`[video-processing] processing job ${job.id}`, job.data)

    await prisma.job.updateMany({
      where: { id: dbJobId },
      data: { status: 'processing', startedAt: new Date() },
    })

    // Generate a long-lived presigned URL (7 days) for playback.
    // In production you would run transcoding here; for now we make
    // the uploaded object directly playable.
    const { getPresignedDownloadUrl } = await import('../lib/server/storage-core')
    const videoUrl = await getPresignedDownloadUrl(s3Key, 60 * 60 * 24 * 7)

    await prisma.videoUpload.updateMany({
      where: { id: uploadId, schoolId },
      data: { status: 'ready' },
    })

    await prisma.job.updateMany({
      where: { id: dbJobId },
      data: {
        status: 'completed',
        result: { resultUrl: videoUrl },
        doneAt: new Date(),
      },
    })

    console.log(`[video-processing] job ${job.id} completed — videoUrl ready`)
  },
  { connection },
)

const workers = [
  certificateWorker,
  videoWorker,
  duplicationWorker,
  makeWorker<EmailDigestJobData>('email-digest'),
]

for (const worker of workers) {
  worker.on('completed', (job) => console.log(`[${worker.name}] job ${job.id} completed`))
  worker.on('failed', (job, err) => console.error(`[${worker.name}] job ${job?.id} failed`, err))
}

console.log('Workers started for:', workers.map((w) => w.name).join(', '))

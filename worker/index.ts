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

const duplicationWorker = new Worker<DuplicationJobData>(
  'course-duplication',
  async (job: Job<DuplicationJobData>) => {
    console.log(`[course-duplication] processing job ${job.id}`, job.data)

    await prisma.job.update({
      where: { id: job.name },
      data: { status: 'completed', doneAt: new Date() },
    })

    console.log(`[course-duplication] job ${job.id} completed`)
  },
  { connection }
)

const workers = [
  makeWorker<CertificateJobData>('certificate-generation'),
  makeWorker<VideoJobData>('video-processing'),
  duplicationWorker,
  makeWorker<EmailDigestJobData>('email-digest'),
]

for (const worker of workers) {
  worker.on('completed', (job) => console.log(`[${worker.name}] job ${job.id} completed`))
  worker.on('failed', (job, err) => console.error(`[${worker.name}] job ${job?.id} failed`, err))
}

console.log('Workers started for:', workers.map((w) => w.name).join(', '))

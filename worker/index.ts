import { Worker, type Job } from 'bullmq'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import Redis from 'ioredis'
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

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

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
    const { sourceCourseId, newTitle, schoolId } = job.data
    console.log(`[course-duplication] processing job ${job.id}`, job.data)

    await prisma.job.updateMany({
      where: { id: job.name },
      data: { status: 'processing', startedAt: new Date() },
    })

    const source = await prisma.course.findFirst({
      where: { id: sourceCourseId, schoolId },
      include: {
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                quiz: { include: { questions: { orderBy: { position: 'asc' } } } },
                homework: { include: { questions: { orderBy: { position: 'asc' } } } },
              },
            },
          },
        },
      },
    })

    if (!source) {
      await prisma.job.updateMany({
        where: { id: job.name },
        data: { status: 'failed', error: 'Source course not found', doneAt: new Date() },
      })
      return
    }

    let slug = newTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100) || 'course'

    const existing = await prisma.course.findUnique({
      where: { schoolId_slug: { schoolId, slug } },
    })
    if (existing) slug = `${slug}-${Date.now()}`

    const newCourse = await prisma.course.create({
      data: {
        schoolId,
        title: newTitle,
        slug,
        description: source.description,
        thumbnailUrl: source.thumbnailUrl,
        status: 'draft',
        priceUsd: source.priceUsd,
        accessDurationDays: source.accessDurationDays,
        completionRequirements: source.completionRequirements as object,
      },
    })

    for (const mod of source.modules) {
      const newModule = await prisma.module.create({
        data: {
          courseId: newCourse.id,
          schoolId,
          title: mod.title,
          position: mod.position,
          status: 'draft',
        },
      })

      for (const lesson of mod.lessons) {
        const newLesson = await prisma.lesson.create({
          data: {
            moduleId: newModule.id,
            schoolId,
            title: lesson.title,
            position: lesson.position,
            type: lesson.type,
            status: 'draft',
            blocks: lesson.blocks as object,
            videoUrl: lesson.videoUrl,
            durationS: lesson.durationS,
          },
        })

        if (lesson.quiz) {
          const newQuiz = await prisma.quiz.create({
            data: {
              lessonId: newLesson.id,
              schoolId,
              title: lesson.quiz.title,
              passingScore: lesson.quiz.passingScore,
              cooldownMinutes: lesson.quiz.cooldownMinutes,
            },
          })
          if (lesson.quiz.questions.length > 0) {
            await prisma.quizQuestion.createMany({
              data: lesson.quiz.questions.map((q) => ({
                quizId: newQuiz.id,
                schoolId,
                text: q.text,
                type: q.type,
                options: (q.options ?? []) as string[],
                correctAnswer: q.correctAnswer,
                position: q.position,
                points: q.points,
              })),
            })
          }
        }

        if (lesson.homework) {
          const newHomework = await prisma.homework.create({
            data: {
              lessonId: newLesson.id,
              schoolId,
              title: lesson.homework.title,
              description: lesson.homework.description,
            },
          })
          if (lesson.homework.questions.length > 0) {
            await prisma.homeworkQuestion.createMany({
              data: lesson.homework.questions.map((q) => ({
                homeworkId: newHomework.id,
                schoolId,
                text: q.text,
                type: q.type,
                options: q.options,
                position: q.position,
                required: q.required,
              })),
            })
          }
        }
      }
    }

    await redis.del(`courses:${schoolId}`)

    await prisma.job.updateMany({
      where: { id: job.name },
      data: { status: 'completed', result: { newCourseId: newCourse.id }, doneAt: new Date() },
    })

    console.log(`[course-duplication] job ${job.id} completed — newCourseId: ${newCourse.id}`)
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

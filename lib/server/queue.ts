import 'server-only'

import { Queue } from 'bullmq'

export interface CertificateJobData {
  studentId: string
  courseId: string
  enrollmentId: string
  certificateId: string
}

export interface VideoJobData {
  uploadId: string
  s3Key: string
  schoolId: string
  dbJobId: string
}

export interface DuplicationJobData {
  sourceCourseId: string
  newTitle: string
  schoolId: string
  requesterId: string
}

export interface EmailDigestJobData {
  schoolId: string
  date: string
}

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { age: 1800, count: 100 },
  removeOnFail: { age: 86400, count: 500 },
}

export const certificateQueue = new Queue<CertificateJobData>('certificate-generation', {
  connection,
  defaultJobOptions,
})

export const videoQueue = new Queue<VideoJobData>('video-processing', {
  connection,
  defaultJobOptions,
})

export const duplicationQueue = new Queue<DuplicationJobData>('course-duplication', {
  connection,
  defaultJobOptions,
})

export const emailDigestQueue = new Queue<EmailDigestJobData>('email-digest', {
  connection,
  defaultJobOptions,
})

import 'server-only'

import { Queue } from 'bullmq'

export interface CertificateJobData {
  studentId: string
  courseId: string
  enrollmentId: string
}

export interface VideoJobData {
  uploadId: string
  s3Key: string
  schoolId: string
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

export const certificateQueue = new Queue<CertificateJobData>('certificate-generation', {
  connection,
})

export const videoQueue = new Queue<VideoJobData>('video-processing', {
  connection,
})

export const duplicationQueue = new Queue<DuplicationJobData>('course-duplication', {
  connection,
})

export const emailDigestQueue = new Queue<EmailDigestJobData>('email-digest', {
  connection,
})

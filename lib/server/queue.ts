import 'server-only'

import { Queue } from 'bullmq'
import { redis } from './redis'

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

const connection = redis

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

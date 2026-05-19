import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { notFound } from 'next/navigation'
import { db } from '@/lib/server/db'
import { CertificateView } from '@/components/certificate/CertificateView'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ jobId?: string }>
}

async function getSchoolId(userId: string): Promise<string | null> {
  const membership = await db.schoolMembership.findFirst({
    where: { userId, role: 'student' },
    select: { schoolId: true },
  })
  return membership?.schoolId ?? null
}

export default async function CertificatePage({ params, searchParams }: Props) {
  const { id } = await params
  const { jobId } = await searchParams

  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value

  let userId: string | null = null
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-secret-change-me',
      )
      const { payload } = await jwtVerify(token, secret)
      userId = payload.sub ?? null
    } catch {
      // handled by layout redirect
    }
  }

  if (!userId) notFound()

  const schoolId = await getSchoolId(userId)
  if (!schoolId) notFound()

  const certificate = await db.certificate.findFirst({
    where: { id, userId, schoolId },
    include: {
      course: { select: { title: true } },
    },
  })

  if (!certificate) notFound()

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      <CertificateView
        certificateId={certificate.id}
        jobId={jobId ?? null}
        courseTitle={certificate.course.title}
      />
    </div>
  )
}

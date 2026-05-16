import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { withAuth } from '@/lib/server/middleware/withAuth'
import { withTenant, type TenantHandler } from '@/lib/server/middleware/withTenant'
import { getPresignedDownloadUrl } from '@/lib/server/storage'

function getCertificateId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/')
  const idx = segments.indexOf('certificates')
  return segments[idx + 1] ?? ''
}

const getHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx, userId } = ctx

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const id = getCertificateId(req)

  const certificate = await tx.certificate.findFirst({
    where: { id, schoolId, userId },
  })

  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  if (!certificate.pdfUrl) {
    return NextResponse.json({ error: 'Certificate is not yet ready' }, { status: 202 })
  }

  const downloadUrl = await getPresignedDownloadUrl(certificate.pdfUrl, 3600)

  return NextResponse.redirect(downloadUrl, 302)
}

export const GET = withLogging(withAuth(withTenant(getHandler)))

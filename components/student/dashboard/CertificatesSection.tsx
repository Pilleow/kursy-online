'use client'

import Link from 'next/link'
import { Award, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CertificateWithCourse } from '@/lib/api/progress'

type Props = {
  certificates: CertificateWithCourse[]
  isLoading: boolean
}

function CertSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  )
}

export function CertificatesSection({ certificates, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <CertSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (certificates.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
      <div className="space-y-3">
        {certificates.map((cert) => {
          const issued = new Date(cert.issuedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          return (
            <div
              key={cert.id}
              className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{cert.course.title}</p>
                <p className="text-xs text-gray-500">Issued {issued}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/certificates/${cert.id}`}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Link>
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

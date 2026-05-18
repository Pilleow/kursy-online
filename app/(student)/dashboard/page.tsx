'use client'

import { useMyEnrollments } from '@/lib/hooks/useEnrollments'
import { useCertificates } from '@/lib/hooks/useProgress'
import { MyCoursesList } from '@/components/student/dashboard/MyCoursesList'
import { CertificatesSection } from '@/components/student/dashboard/CertificatesSection'

export default function DashboardPage() {
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useMyEnrollments()
  const { data: certificates = [], isLoading: certsLoading } = useCertificates()

  const isLoading = enrollmentsLoading || certsLoading

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">My Learning</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick up where you left off or earn a new certificate.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
        <MyCoursesList
          enrollments={enrollments}
          certificates={certificates}
          isLoading={isLoading}
        />
      </section>

      <CertificatesSection certificates={certificates} isLoading={certsLoading} />
    </div>
  )
}

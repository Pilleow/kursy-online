import { Building2 } from 'lucide-react'
import { db } from '@/lib/server/db'
import { SchoolsTable } from './_components/SchoolsTable'

export default async function SystemSchoolsPage() {
  const schools = await db.school.findMany({
    include: {
      plan: true,
      _count: { select: { courses: true, memberships: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-gray-400" />
          Schools
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {schools.length} tenant school{schools.length !== 1 ? 's' : ''} registered on the platform.
        </p>
      </div>

      <SchoolsTable schools={schools} />
    </div>
  )
}

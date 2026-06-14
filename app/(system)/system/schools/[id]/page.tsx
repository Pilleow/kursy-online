import { ArrowLeft, Building2, BookOpen, Users, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/server/db'
import { Badge } from '@/components/ui/badge'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-900/60 text-amber-300',
  admin: 'bg-blue-900/60 text-blue-300',
  instructor: 'bg-purple-900/60 text-purple-300',
  student: 'bg-gray-700 text-gray-300',
}

export default async function SystemSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const school = await db.school.findUnique({
    where: { id },
    include: {
      plan: true,
      memberships: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      },
      _count: { select: { courses: true, memberships: true, enrollments: true } },
    },
  })

  if (!school) notFound()

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <Link
          href="/system/schools"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Schools
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-gray-400" />
              {school.name}
            </h1>
            <p className="mt-1 text-xs text-gray-600 font-mono">{school.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs border-0 bg-gray-700 text-gray-300">{school.plan.name}</Badge>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                school.isActive
                  ? 'bg-green-900/60 text-green-400'
                  : 'bg-red-900/60 text-red-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${school.isActive ? 'bg-green-400' : 'bg-red-400'}`}
              />
              {school.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Courses" value={school._count.courses} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Members" value={school._count.memberships} />
        <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Enrollments" value={school._count.enrollments} />
      </div>

      {/* Members */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
          Members ({school.memberships.length})
        </h2>
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          {school.memberships.length === 0 ? (
            <div className="bg-gray-950 p-8 text-center">
              <p className="text-gray-500 text-sm">No members yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900">
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {school.memberships.map((m) => (
                  <tr key={m.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-100">
                      {m.user.firstName} {m.user.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{m.user.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-xs border-0 capitalize ${ROLE_COLORS[m.role] ?? 'bg-gray-700 text-gray-300'}`}
                      >
                        {m.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  )
}

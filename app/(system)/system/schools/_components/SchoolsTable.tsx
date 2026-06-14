'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { Badge } from '@/components/ui/badge'

type Plan = { id: string; name: string }
type School = {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string | Date
  plan: Plan
  _count: { courses: number; memberships: number }
}

const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-gray-700 text-gray-300',
  Pro: 'bg-blue-900/60 text-blue-300',
  Enterprise: 'bg-purple-900/60 text-purple-300',
}

export function SchoolsTable({ schools }: { schools: School[] }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [statuses, setStatuses] = useState<Record<string, boolean>>(
    Object.fromEntries(schools.map((s) => [s.id, s.isActive])),
  )
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleActive(id: string) {
    setBusy(id)
    try {
      const res = await fetch(`/api/v1/system/schools/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !statuses[id] }),
      })
      if (res.ok) {
        setStatuses((prev) => ({ ...prev, [id]: !prev[id] }))
      }
    } finally {
      setBusy(null)
    }
  }

  if (schools.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
        <p className="text-gray-500 text-sm">No schools registered yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-4 py-3 text-left font-medium text-gray-400">School</th>
            <th className="px-4 py-3 text-left font-medium text-gray-400">Plan</th>
            <th className="px-4 py-3 text-center font-medium text-gray-400">Courses</th>
            <th className="px-4 py-3 text-center font-medium text-gray-400">Members</th>
            <th className="px-4 py-3 text-left font-medium text-gray-400">Created</th>
            <th className="px-4 py-3 text-center font-medium text-gray-400">Active</th>
            <th className="px-4 py-3 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {schools.map((school) => (
            <tr key={school.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-100">{school.name}</p>
                  <p className="text-xs text-gray-500">{school.slug}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge className={`text-xs font-medium border-0 ${PLAN_COLORS[school.plan.name] ?? 'bg-gray-700 text-gray-300'}`}>
                  {school.plan.name}
                </Badge>
              </td>
              <td className="px-4 py-3 text-center text-gray-300">{school._count.courses}</td>
              <td className="px-4 py-3 text-center text-gray-300">{school._count.memberships}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {new Date(school.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleActive(school.id)}
                  disabled={busy === school.id}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
                    statuses[school.id] ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                      statuses[school.id] ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/system/schools/${school.id}`}
                  className="text-gray-500 hover:text-gray-200 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

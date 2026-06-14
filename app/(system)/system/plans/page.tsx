import { CreditCard } from 'lucide-react'
import { db } from '@/lib/server/db'
import { Badge } from '@/components/ui/badge'

const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-gray-700 text-gray-300',
  Pro: 'bg-blue-900/60 text-blue-300',
  Enterprise: 'bg-purple-900/60 text-purple-300',
}

export default async function SystemPlansPage() {
  const plans = await db.plan.findMany({
    include: { _count: { select: { schools: true } } },
    orderBy: { priceUsd: 'asc' },
  })

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CreditCard className="h-6 w-6 text-gray-400" />
          Plans
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {plans.length} plan{plans.length !== 1 ? 's' : ''} available on the platform.
        </p>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Plan</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Max Courses</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Max Students</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Storage</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Price / mo</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Active Schools</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {plans.map((plan) => (
              <tr key={plan.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                <td className="px-4 py-3">
                  <Badge
                    className={`text-xs font-medium border-0 ${PLAN_COLORS[plan.name] ?? 'bg-gray-700 text-gray-300'}`}
                  >
                    {plan.name}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center text-gray-300">
                  {plan.maxCourses === -1 ? '∞' : plan.maxCourses}
                </td>
                <td className="px-4 py-3 text-center text-gray-300">
                  {plan.maxStudents === -1 ? '∞' : plan.maxStudents.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-gray-300">
                  {plan.maxStorageMb >= 1024
                    ? `${(plan.maxStorageMb / 1024).toFixed(0)} GB`
                    : `${plan.maxStorageMb} MB`}
                </td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {Number(plan.priceUsd) === 0
                    ? 'Free'
                    : `$${Number(plan.priceUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center h-6 w-10 rounded-full bg-gray-800 text-gray-300 text-xs font-medium">
                    {plan._count.schools}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

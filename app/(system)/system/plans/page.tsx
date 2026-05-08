import { CreditCard } from 'lucide-react'

export default function SystemPlansPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CreditCard className="h-6 w-6 text-gray-400" />
          Plans
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Configure Starter, Pro, and Enterprise plan limits.
        </p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
        <CreditCard className="mx-auto h-10 w-10 text-gray-700 mb-4" />
        <p className="text-gray-500 text-sm">Plans management — coming soon.</p>
      </div>
    </div>
  )
}

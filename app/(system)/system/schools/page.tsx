import { Building2 } from 'lucide-react'

export default function SystemSchoolsPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-gray-400" />
          Schools
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage all tenant schools across the platform.
        </p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
        <Building2 className="mx-auto h-10 w-10 text-gray-700 mb-4" />
        <p className="text-gray-500 text-sm">Schools management — coming soon.</p>
      </div>
    </div>
  )
}

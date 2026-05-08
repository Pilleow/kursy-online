import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function SystemSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-gray-400" />
          School detail
        </h1>
        <p className="mt-1 text-xs text-gray-600 font-mono">{id}</p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
        <Building2 className="mx-auto h-10 w-10 text-gray-700 mb-4" />
        <p className="text-gray-500 text-sm">School detail view — coming soon.</p>
      </div>
    </div>
  )
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminCourseBuilderPage({ params }: Props) {
  const { id } = await params

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Curriculum Builder
        </h1>
        <p className="mt-1 text-sm text-gray-500">Course {id} — drag modules and lessons.</p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center text-sm text-gray-400">
        Curriculum builder — coming soon.
      </div>
    </div>
  )
}

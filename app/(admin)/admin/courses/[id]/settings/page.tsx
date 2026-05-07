type Props = { params: Promise<{ id: string }> }

export default async function AdminCourseSettingsPage({ params }: Props) {
  const { id } = await params

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Course Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure course {id}.</p>
      </div>

      <div className="max-w-xl space-y-4">
        {['Title', 'Slug', 'Price (USD)', 'Status'].map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {field}
            </label>
            <div className="h-9 rounded-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">School Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure your school account.</p>
      </div>

      <div className="max-w-xl space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            General
          </h2>
          <div className="space-y-4">
            {['School name', 'Custom domain', 'Logo URL'].map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">{field}</label>
                <div className="h-9 rounded-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            API Keys
          </h2>
          <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-4 py-6 text-center text-sm text-gray-400">No API keys.</div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function AdminTranslationsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Translations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage UI copy and translations.</p>
        </div>
        <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Save changes
        </button>
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 py-10 text-center text-sm text-gray-400">
          No translation keys defined.
        </div>
      </div>
    </div>
  )
}

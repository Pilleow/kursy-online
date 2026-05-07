export default function AdminStudentsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Students</h1>
          <p className="mt-1 text-sm text-gray-500">All students across your school.</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 py-10 text-center text-sm text-gray-400">No students found.</div>
      </div>
    </div>
  )
}

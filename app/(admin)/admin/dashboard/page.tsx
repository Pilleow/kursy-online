export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your school&apos;s activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {['Total Courses', 'Active Students', 'Enrollments', 'Pending Reviews'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}

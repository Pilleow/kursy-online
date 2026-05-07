export default function AdminCoursesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Courses</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all courses in your school.</p>
        </div>
        <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          New course
        </button>
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 py-10 text-center text-sm text-gray-400">
          No courses yet. Create your first course.
        </div>
      </div>
    </div>
  )
}

import { CourseSettingsForm } from '@/components/curriculum/CourseSettingsForm'

type Props = { params: Promise<{ id: string }> }

export default async function AdminCourseSettingsPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Course Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage pricing, access, and completion rules.</p>
      </div>
      <CourseSettingsForm courseId={id} />
    </div>
  )
}

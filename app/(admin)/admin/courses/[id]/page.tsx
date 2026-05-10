import { CurriculumEditor } from '@/components/curriculum/CurriculumEditor'

type Props = { params: Promise<{ id: string }> }

export default async function AdminCourseBuilderPage({ params }: Props) {
  const { id } = await params

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Curriculum Builder
        </h1>
        <p className="mt-1 text-sm text-gray-500">Drag modules and lessons to reorder.</p>
      </div>

      <CurriculumEditor courseId={id} />
    </div>
  )
}

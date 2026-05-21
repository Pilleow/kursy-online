import { QAList } from '@/components/qa/QAList'

type Props = { params: Promise<{ id: string }> }

export default async function InstructorQAPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Q&amp;A</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and answer student questions across all lessons.
        </p>
      </div>
      <QAList courseId={id} />
    </div>
  )
}

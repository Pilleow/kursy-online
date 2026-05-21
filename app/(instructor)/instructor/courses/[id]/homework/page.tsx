import { HomeworkQueue } from '@/components/homework/HomeworkQueue'

type Props = { params: Promise<{ id: string }> }

export default async function InstructorHomeworkPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Homework</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review student submissions and send feedback.
        </p>
      </div>
      <HomeworkQueue courseId={id} />
    </div>
  )
}

type Props = { params: Promise<{ id: string }> }

export default async function InstructorHomeworkPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Homework</h1>
      <p className="text-sm text-gray-500">
        Course <code className="font-mono">{id}</code>
      </p>
      <p className="text-sm text-gray-400">
        Submissions awaiting feedback will appear here.
      </p>
    </div>
  )
}

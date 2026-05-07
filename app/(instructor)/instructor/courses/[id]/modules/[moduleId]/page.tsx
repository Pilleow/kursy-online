type Props = { params: Promise<{ id: string; moduleId: string }> }

export default async function InstructorModulePage({ params }: Props) {
  const { id, moduleId } = await params

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Module</h1>
      <p className="text-sm text-gray-500">
        Course <code className="font-mono">{id}</code> — module{' '}
        <code className="font-mono">{moduleId}</code>
      </p>
      <p className="text-sm text-gray-400">Lesson list and content editor will appear here.</p>
    </div>
  )
}

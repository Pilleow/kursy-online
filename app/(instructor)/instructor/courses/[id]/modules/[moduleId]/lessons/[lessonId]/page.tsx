type Props = { params: Promise<{ id: string; moduleId: string; lessonId: string }> }

export default async function InstructorLessonEditorPage({ params }: Props) {
  const { id, moduleId, lessonId } = await params

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Lesson Editor</h1>
      <p className="text-sm text-gray-500">
        Course <code className="font-mono">{id}</code> — module{' '}
        <code className="font-mono">{moduleId}</code> — lesson{' '}
        <code className="font-mono">{lessonId}</code>
      </p>
      <p className="text-sm text-gray-400">Block editor (Tiptap) will appear here.</p>
    </div>
  )
}

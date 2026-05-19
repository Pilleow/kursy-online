import { Suspense } from 'react'
import { ModuleEditorClient } from './_components/ModuleEditorClient'

type Props = {
  params: Promise<{ id: string; moduleId: string }>
  searchParams: Promise<{ lesson?: string }>
}

export default async function InstructorModulePage({ params, searchParams }: Props) {
  const { id, moduleId } = await params
  const { lesson: selectedLessonId } = await searchParams

  return (
    <Suspense>
      <ModuleEditorClient
        courseId={id}
        moduleId={moduleId}
        selectedLessonId={selectedLessonId}
      />
    </Suspense>
  )
}

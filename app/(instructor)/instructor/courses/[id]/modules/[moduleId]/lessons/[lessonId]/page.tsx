import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BlockEditor } from '@/components/editor/BlockEditor'
import { db } from '@/lib/server/db'

type Props = { params: Promise<{ id: string; moduleId: string; lessonId: string }> }

export default async function InstructorLessonEditorPage({ params }: Props) {
  const { lessonId } = await params

  const cookieStore = await cookies()
  const schoolId = cookieStore.get('schoolId')?.value
  if (!schoolId) redirect('/login')

  const lesson = await db.lesson.findFirst({ where: { id: lessonId, schoolId } })
  if (!lesson) redirect('/instructor/dashboard')

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-6 py-3 dark:border-gray-800">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-50">{lesson.title}</h1>
      </div>
      <BlockEditor
        lessonId={lessonId}
        initialBlocks={(lesson.blocks as Parameters<typeof BlockEditor>[0]['initialBlocks']) ?? []}
        lessonStatus={lesson.status as 'draft' | 'pending_review' | 'published'}
      />
    </div>
  )
}

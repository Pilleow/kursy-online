import { LessonViewer } from '@/components/student/LessonViewer'

type Props = { params: Promise<{ courseSlug: string; lessonId: string }> }

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonId } = await params
  return <LessonViewer courseSlug={courseSlug} lessonId={lessonId} />
}

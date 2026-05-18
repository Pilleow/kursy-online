import { HomeworkPlayer } from '@/components/homework/HomeworkPlayer'

type Props = {
  params: Promise<{ courseSlug: string; hwId: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function HomeworkPage({ params, searchParams }: Props) {
  const { courseSlug, hwId } = await params
  const { from } = await searchParams
  return <HomeworkPlayer hwId={hwId} courseSlug={courseSlug} returnLessonId={from} />
}

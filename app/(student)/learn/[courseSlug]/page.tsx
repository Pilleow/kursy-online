import { LearnPageClient } from './_components/LearnPageClient'

type Props = {
  params: Promise<{ courseSlug: string }>
  searchParams: Promise<{ lesson?: string }>
}

export default async function LearnPage({ params, searchParams }: Props) {
  const { courseSlug } = await params
  const { lesson: lessonId } = await searchParams

  return <LearnPageClient courseSlug={courseSlug} lessonId={lessonId} />
}

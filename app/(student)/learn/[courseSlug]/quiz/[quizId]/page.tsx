import { QuizPlayer } from '@/components/quiz/QuizPlayer'

type Props = {
  params: Promise<{ courseSlug: string; quizId: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function QuizPage({ params, searchParams }: Props) {
  const { courseSlug, quizId } = await params
  const { from } = await searchParams
  return <QuizPlayer quizId={quizId} courseSlug={courseSlug} returnLessonId={from} />
}

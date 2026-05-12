import { QuizPlayer } from '@/components/quiz/QuizPlayer'

type Props = { params: Promise<{ courseSlug: string; quizId: string }> }

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params
  return <QuizPlayer quizId={quizId} />
}

import { HomeworkPlayer } from '@/components/homework/HomeworkPlayer'

type Props = { params: Promise<{ courseSlug: string; hwId: string }> }

export default async function HomeworkPage({ params }: Props) {
  const { hwId } = await params
  return <HomeworkPlayer hwId={hwId} />
}

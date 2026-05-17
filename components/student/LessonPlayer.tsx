'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, CheckCircle, FileText, ListChecks, MessageSquare } from 'lucide-react'
import { useLesson } from '@/lib/hooks/useLesson'
import { useCompleteLesson } from '@/lib/hooks/useProgress'
import { Button } from '@/components/ui/button'
import { QASection } from '@/components/qa/QASection'
import type { Block, TextBlock, VideoBlock, QuizBlock, HomeworkBlock, QASectionBlock } from '@/lib/types'
// react-markdown is installed; TextBlock stores Tiptap HTML so we render via dangerouslySetInnerHTML.
// Switch to <ReactMarkdown> here if block content changes to markdown strings.

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function TextBlockRenderer({ block }: { block: TextBlock }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  )
}

function VideoBlockRenderer({ block }: { block: VideoBlock }) {
  return (
    <figure className="space-y-2">
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video
          src={block.url}
          controls
          className="w-full h-full"
          preload="metadata"
        />
      </div>
      {block.caption && (
        <figcaption className="text-xs text-center text-gray-400">{block.caption}</figcaption>
      )}
    </figure>
  )
}

function QuizBlockRenderer({ block, courseSlug }: { block: QuizBlock; courseSlug: string }) {
  return (
    <Link
      href={`/learn/${courseSlug}/quiz/${block.quizId}`}
      className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors group"
    >
      <ListChecks className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary">Take Quiz</p>
        <p className="text-xs text-gray-500">Complete the quiz for this lesson</p>
      </div>
      <span className="text-xs text-primary font-medium group-hover:underline">Start →</span>
    </Link>
  )
}

function HomeworkBlockRenderer({ block, courseSlug }: { block: HomeworkBlock; courseSlug: string }) {
  return (
    <Link
      href={`/learn/${courseSlug}/homework/${block.homeworkId}`}
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
    >
      <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Homework Assignment</p>
        <p className="text-xs text-gray-500">Submit your work for instructor feedback</p>
      </div>
      <span className="text-xs text-amber-600 font-medium group-hover:underline">Open →</span>
    </Link>
  )
}

function QASectionBlockRenderer({ block }: { block: QASectionBlock }) {
  return (
    <div className="space-y-3">
      {block.prompt && (
        <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{block.prompt}</p>
        </div>
      )}
    </div>
  )
}

function BlockRenderer({ block, courseSlug }: { block: Block; courseSlug: string }) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />
    case 'video':
      return <VideoBlockRenderer block={block} />
    case 'quiz':
      return <QuizBlockRenderer block={block} courseSlug={courseSlug} />
    case 'homework':
      return <HomeworkBlockRenderer block={block} courseSlug={courseSlug} />
    case 'qa_section':
      return <QASectionBlockRenderer block={block} />
    default:
      return null
  }
}

function CompleteButton({ lessonId }: { lessonId: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const { mutate: completeLesson, isPending, isSuccess } = useCompleteLesson()

  useEffect(() => {
    // Reset when lesson changes
    setScrolledToBottom(false)
  }, [lessonId])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setScrolledToBottom(true)
      },
      { threshold: 1.0 },
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [lessonId])

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        Lesson completed!
      </div>
    )
  }

  return (
    <>
      {/* Sentinel div — when visible, the user has reached the bottom */}
      <div ref={sentinelRef} className="h-px" />
      <Button
        onClick={() => completeLesson(lessonId)}
        disabled={!scrolledToBottom || isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? 'Saving…' : scrolledToBottom ? 'Mark as Complete' : 'Scroll to the bottom to complete'}
      </Button>
    </>
  )
}

type Props = {
  lessonId: string
  courseSlug: string
}

export function LessonPlayer({ lessonId, courseSlug }: Props) {
  const { data: lesson, isLoading, isError } = useLesson(lessonId)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-8 bg-gray-100 rounded w-3/4" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    )
  }

  if (isError || !lesson) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
        Lesson not found or you don&apos;t have access to it.
      </div>
    )
  }

  const blocks: Block[] = Array.isArray(lesson.blocks) ? (lesson.blocks as Block[]) : []

  return (
    <article className="space-y-8">
      {/* Lesson header */}
      <header className="space-y-2 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium">
          <BookOpen className="h-3.5 w-3.5" />
          {lesson.type}
          {lesson.durationS != null && (
            <>
              <span>·</span>
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(lesson.durationS)}
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{lesson.title}</h1>
      </header>

      {/* Content blocks */}
      {blocks.length > 0 ? (
        <div className="space-y-6">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} courseSlug={courseSlug} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
          No content yet.
        </div>
      )}

      {/* Q&A */}
      <section className="border-t border-gray-100 pt-8">
        <QASection lessonId={lessonId} />
      </section>

      {/* Complete button */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
        <CompleteButton lessonId={lessonId} />
      </div>
    </article>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useCourseBySlug } from '@/lib/hooks/useCourses'
import { useCourseProgress } from '@/lib/hooks/useProgress'
import { ProgressTracker } from '@/components/student/ProgressTracker'
import { CourseNav } from '@/components/student/CourseNav'
import { LessonPlayer } from '@/components/student/LessonPlayer'

type Props = {
  courseSlug: string
  lessonId: string | undefined
}

export function LearnPageClient({ courseSlug, lessonId }: Props) {
  const router = useRouter()
  const { data: course, isLoading: courseLoading } = useCourseBySlug(courseSlug)
  const { data: progress } = useCourseProgress(course?.id ?? '')

  // Auto-navigate to first lesson when none is selected
  if (!lessonId && course?.modules?.length) {
    const firstLesson = course.modules[0]?.lessons?.[0]
    if (firstLesson) {
      router.replace(`/learn/${courseSlug}?lesson=${firstLesson.id}`)
    }
  }

  const completedLessonIds = progress?.completedLessonIds ?? []
  const percent = progress?.percentComplete ?? 0

  const allLessons =
    course?.modules
      .slice()
      .sort((a, b) => a.position - b.position)
      .flatMap((m) => m.lessons.slice().sort((a, b) => a.position - b.position)) ?? []

  const currentIdx = allLessons.findIndex((l) => l.id === lessonId)
  const nextLesson = currentIdx >= 0 ? allLessons[currentIdx + 1] : undefined

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <ProgressTracker percent={percent} />

      {/* Sidebar + content layout */}
      <div className="flex gap-6 items-start pt-2">
        {/* Sticky sidebar */}
        <aside className="w-64 shrink-0 sticky top-[calc(3.5rem+1rem)] max-h-[calc(100vh-3.5rem-2rem)] overflow-y-auto">
          {courseLoading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : course ? (
            <CourseNav
              courseSlug={courseSlug}
              modules={course.modules}
              currentLessonId={lessonId}
              completedLessonIds={completedLessonIds}
              completionRequirements={course.completionRequirements}
            />
          ) : null}
        </aside>

        {/* Main lesson content */}
        <main className="flex-1 min-w-0">
          {lessonId ? (
            <LessonPlayer
              lessonId={lessonId}
              courseSlug={courseSlug}
              nextLessonId={nextLesson?.id}
            />
          ) : !courseLoading ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-400">Select a lesson from the sidebar to begin.</p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

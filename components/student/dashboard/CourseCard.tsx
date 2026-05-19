'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Award, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourseProgress, useGenerateCertificate } from '@/lib/hooks/useProgress'
import { useCourseBySlug } from '@/lib/hooks/useCourses'
import type { EnrollmentWithCourse } from '@/lib/api/enrollments'
import type { CertificateWithCourse } from '@/lib/api/progress'

type Props = {
  enrollment: EnrollmentWithCourse
  certificate?: CertificateWithCourse
}

export function CourseCard({ enrollment, certificate }: Props) {
  const { course } = enrollment
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { data: curriculum, isLoading: curriculumLoading } = useCourseBySlug(course.slug)
  const { data: progress, isLoading: progressLoading } = useCourseProgress(course.id)
  const generateCert = useGenerateCertificate()

  const isLoading = curriculumLoading || progressLoading

  const allLessons =
    curriculum?.modules
      .slice()
      .sort((a, b) => a.position - b.position)
      .flatMap((m) => m.lessons.slice().sort((a, b) => a.position - b.position)) ?? []

  const completedIds = new Set(progress?.completedLessonIds ?? [])
  const percent = progress?.percentComplete ?? 0
  const isComplete = progress?.isComplete ?? false

  const continueLesson = (() => {
    if (allLessons.length === 0) return null
    if (completedIds.size === 0) return allLessons[0]
    return allLessons.find((l) => !completedIds.has(l.id)) ?? allLessons[allLessons.length - 1]
  })()

  const continueHref = continueLesson
    ? `/learn/${course.slug}?lesson=${continueLesson.id}`
    : `/learn/${course.slug}`

  const certPageUrl = certificate ? `/certificates/${certificate.id}` : null

  async function handleGenerateCert() {
    try {
      setIsRedirecting(true)
      const result = await generateCert.mutateAsync(course.id)
      const { certificateId, jobId } = result
      router.push(`/certificates/${certificateId}${jobId ? `?jobId=${jobId}` : ''}`)
    } catch {
      setIsRedirecting(false)
    }
  }

  const isCertGenerating = generateCert.isPending || isRedirecting

  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="shrink-0">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-24 w-36 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-24 w-36 items-center justify-center rounded-lg bg-gray-100">
            <BookOpen className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-3 min-w-0">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{course.title}</h3>
            {isComplete && (
              <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                Completed
              </Badge>
            )}
          </div>
          {course.instructorName && (
            <p className="text-sm text-gray-500">{course.instructorName}</p>
          )}
        </div>

        {/* Progress */}
        {isLoading ? (
          <div className="space-y-1">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : (
          <div className="space-y-1">
            <Progress value={percent} />
            <p className="text-xs text-gray-400">{percent}% complete</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              {certificate ? (
                certPageUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={certPageUrl}>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      View Certificate
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateCert}
                  disabled={isCertGenerating}
                >
                  {isCertGenerating ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Award className="mr-1.5 h-3.5 w-3.5" />
                      Get Certificate
                    </>
                  )}
                </Button>
              )}
              <Button asChild size="sm" variant="ghost" className="text-gray-500">
                <Link href={continueHref}>Review Course</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" disabled={isLoading || allLessons.length === 0}>
              <Link href={continueHref}>Continue</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/server/db'
import { CourseHero } from '@/components/student/CourseHero'
import { CurriculumPreview } from '@/components/student/CurriculumPreview'
import { PriceDisplay } from '@/components/student/PriceDisplay'
import { EnrollButton } from '@/components/student/EnrollButton'

export const revalidate = 60

// ─── ISR: pre-render all published course slugs at build time ─────────────────

export async function generateStaticParams() {
  try {
    const courses = await db.course.findMany({
      where: { status: 'published' },
      select: { slug: true },
    })
    return courses.map((c) => ({ slug: c.slug }))
  } catch {
    // DB not available at build time (e.g. docker build) — ISR generates pages at runtime
    return []
  }
}

// ─── SEO metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = await db.course.findFirst({
    where: { slug, status: 'published' },
    select: { title: true, description: true },
  })
  if (!course) return { title: 'Course not found' }

  return {
    title: `${course.title} — NGV`,
    description: course.description ?? undefined,
    openGraph: {
      title: course.title,
      description: course.description ?? undefined,
      type: 'website',
    },
  }
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getCourseDetail(slug: string) {
  const course = await db.course.findFirst({
    where: { slug, status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceUsd: true,
      school: { select: { name: true } },
      modules: {
        where: { status: 'published' },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            where: { status: 'published' },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              position: true,
              durationS: true,
            },
          },
          assignments: {
            take: 1,
            select: {
              instructor: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  })

  return course
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourseDetail(slug)

  if (!course) notFound()

  const instructor =
    course.modules
      .flatMap((m) => m.assignments)
      .map((a) => `${a.instructor.firstName} ${a.instructor.lastName}`)[0] ?? null

  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const priceUsd = course.priceUsd !== null ? Number(course.priceUsd) : null
  const isFree = priceUsd === null || priceUsd === 0

  return (
    <div className="min-h-screen bg-background">
      <CourseHero
        id={course.id}
        title={course.title}
        description={course.description}
        thumbnailUrl={course.thumbnailUrl}
        instructor={instructor}
        school={course.school.name}
        enrollmentCount={course._count.enrollments}
        moduleCount={course.modules.length}
        lessonCount={lessonCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Curriculum */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-foreground mb-4">Course Curriculum</h2>
            <CurriculumPreview modules={course.modules} />
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5 shadow-sm">
              <PriceDisplay priceUsd={priceUsd} bestCouponPct={null} />

              <EnrollButton
                courseId={course.id}
                courseSlug={course.slug}
                isFree={isFree}
              />

              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Certificate on completion
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

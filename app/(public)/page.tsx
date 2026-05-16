import type { Metadata } from 'next'
import { db } from '@/lib/server/db'
import { CourseGrid, type PublicCourse } from '@/components/student/CourseGrid'

export const metadata: Metadata = {
  title: 'EduFlow — Online Courses',
  description:
    'Browse our catalog of published courses. Learn at your own pace with expert instructors.',
}

async function getPublishedCourses(): Promise<PublicCourse[]> {
  const courses = await db.course.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceUsd: true,
      school: { select: { name: true } },
      modules: {
        take: 1,
        select: {
          assignments: {
            take: 1,
            select: {
              instructor: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  })

  return courses.map((c) => {
    const assignment = c.modules[0]?.assignments[0]
    const instructor = assignment?.instructor
      ? `${assignment.instructor.firstName} ${assignment.instructor.lastName}`
      : null

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl,
      priceUsd: c.priceUsd !== null ? Number(c.priceUsd) : null,
      instructor,
      school: c.school,
    }
  })
}

export default async function LandingPage() {
  const courses = await getPublishedCourses()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Explore Courses
        </h1>
        <p className="mt-3 text-muted-foreground text-lg">
          {courses.length} course{courses.length !== 1 ? 's' : ''} available
        </p>
      </div>
      <CourseGrid courses={courses} />
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import type { PublicCourse } from './CourseGrid'

const PLACEHOLDER_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
]

function gradientForId(id: string) {
  const index = id.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length
  return PLACEHOLDER_GRADIENTS[index]
}

interface CourseCardProps {
  course: PublicCourse
}

export function CourseCard({ course }: CourseCardProps) {
  const price =
    course.priceUsd === null || Number(course.priceUsd) === 0
      ? 'Free'
      : `$${Number(course.priceUsd).toFixed(2)}`

  const instructor = course.instructor ?? course.school.name

  return (
    <Link
      href={`/courses/${course.schoolSlug}/${course.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-44 flex-shrink-0 overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradientForId(course.id)} flex items-center justify-center`}
          >
            <span className="text-white/80 text-4xl font-bold select-none">
              {course.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {course.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground truncate max-w-[60%]">{instructor}</span>
          <span
            className={`text-sm font-semibold ${price === 'Free' ? 'text-emerald-600' : 'text-foreground'}`}
          >
            {price}
          </span>
        </div>
      </div>
    </Link>
  )
}

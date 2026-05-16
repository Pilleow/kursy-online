import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

const PLACEHOLDER_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
]

function gradientForId(id: string) {
  return PLACEHOLDER_GRADIENTS[id.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length]
}

interface CourseHeroProps {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  instructor: string | null
  school: string
  enrollmentCount: number
  moduleCount: number
  lessonCount: number
}

export function CourseHero({
  id,
  title,
  description,
  thumbnailUrl,
  instructor,
  school,
  enrollmentCount,
  moduleCount,
  lessonCount,
}: CourseHeroProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-3">{school}</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{description}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {instructor && (
                <span>
                  Instructor:{' '}
                  <span className="font-medium text-foreground">{instructor}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {enrollmentCount.toLocaleString()} student{enrollmentCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{moduleCount} module{moduleCount !== 1 ? 's' : ''}</Badge>
              <Badge variant="secondary">{lessonCount} lesson{lessonCount !== 1 ? 's' : ''}</Badge>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 384px"
                  priority
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${gradientForId(id)} flex items-center justify-center`}
                >
                  <span className="text-white/80 text-6xl font-bold select-none">
                    {title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

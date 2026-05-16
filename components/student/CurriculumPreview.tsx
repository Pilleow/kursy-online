import type { LessonType } from '@/src/generated/prisma/enums'

interface Lesson {
  id: string
  title: string
  type: LessonType
  position: number
  durationS: number | null
}

interface Module {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

interface CurriculumPreviewProps {
  modules: Module[]
}

function LessonTypeIcon({ type }: { type: LessonType }) {
  if (type === 'quiz') {
    return (
      <svg className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
  if (type === 'homework') {
    return (
      <svg className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  }
  return (
    <svg className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function CurriculumPreview({ modules }: CurriculumPreviewProps) {
  if (modules.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No curriculum published yet.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {modules.map((mod) => (
        <details key={mod.id} className="group" open={mod.position === 1}>
          <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none bg-muted/40 hover:bg-muted/70 transition-colors list-none">
            <div className="flex items-center gap-3 min-w-0">
              <svg
                className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-foreground truncate">{mod.title}</span>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
            </span>
          </summary>

          <ul className="divide-y divide-border/50 bg-background">
            {mod.lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <LessonTypeIcon type={lesson.type} />
                <span className="flex-1 text-foreground truncate">{lesson.title}</span>
                {lesson.durationS != null && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDuration(lesson.durationS)}
                  </span>
                )}
                <LockIcon />
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  )
}

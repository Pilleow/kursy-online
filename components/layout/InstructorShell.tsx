'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  ChevronRight,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useInstructorAssignments, useInstructorStats } from '@/lib/hooks/useInstructorStats'
import type { AssignedModule } from '@/lib/api/instructor'

type ShellUser = {
  name: string
  email: string
}

type CourseGroup = {
  courseId: string
  courseTitle: string
  modules: AssignedModule[]
}

function NavLink({
  href,
  icon: Icon,
  label,
  badge,
  exact,
}: {
  href: string
  icon: React.ElementType
  label: string
  badge?: ReactNode
  exact?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium dark:bg-gray-800 dark:text-gray-50'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge}
      {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
    </Link>
  )
}

function AttentionBadge({ count, color }: { count: number; color: 'orange' | 'blue' }) {
  if (count === 0) return null
  return (
    <span
      className={cn(
        'ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white',
        color === 'orange' ? 'bg-orange-500' : 'bg-blue-500',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function InstructorShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const router = useRouter()
  const { data: assignments = [] } = useInstructorAssignments()
  const { data: stats } = useInstructorStats()

  const pendingHomework = stats?.pendingHomeworkCount ?? 0
  const unreadQA = stats?.unreadQACount ?? 0

  const courseGroups = useMemo<CourseGroup[]>(() => {
    const map = new Map<string, CourseGroup>()
    for (const a of assignments) {
      const { course } = a.module
      if (!map.has(course.id)) {
        map.set(course.id, { courseId: course.id, courseTitle: course.title, modules: [] })
      }
      map.get(course.id)!.modules.push(a)
    }
    return Array.from(map.values())
  }, [assignments])

  // collapsed courses — none collapsed by default
  const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(new Set())
  function toggleCourse(courseId: string) {
    setCollapsedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hasAttention = pendingHomework > 0 || unreadQA > 0

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        {/* Logo */}
        <div className="flex h-12 items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 px-4">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold shrink-0">
            E
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50 truncate">
            EduFlow
          </span>
          <span className="ml-auto text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Instructor
          </span>
        </div>

        {/* Attention bar */}
        {hasAttention && (
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 px-3 py-2">
            {pendingHomework > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <ClipboardCheck className="h-3 w-3" />
                {pendingHomework} pending
              </span>
            )}
            {unreadQA > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <MessageSquare className="h-3 w-3" />
                {unreadQA} questions
              </span>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* Dashboard */}
          <NavLink
            href="/instructor/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            exact
          />

          {/* Course accordions */}
          {courseGroups.map((group) => {
            const isCollapsed = collapsedCourses.has(group.courseId)
            const courseUnreadQA = group.modules.reduce((s, a) => s + a.module.unreadQACount, 0)
            const coursePendingHw = group.modules.reduce((s, a) => s + a.module.pendingHomeworkCount, 0)
            return (
              <div key={group.courseId} className="pt-1">
                {/* Course header toggle */}
                <button
                  onClick={() => toggleCourse(group.courseId)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
                  )}
                  <span className="flex-1 truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {group.courseTitle}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.modules.map((a) => (
                      <NavLink
                        key={a.assignmentId}
                        href={`/instructor/courses/${group.courseId}/modules/${a.module.id}`}
                        icon={BookOpen}
                        label={a.module.title}
                      />
                    ))}

                    <NavLink
                      href={`/instructor/courses/${group.courseId}/qa`}
                      icon={MessageSquare}
                      label="Q&A"
                      badge={<AttentionBadge count={courseUnreadQA} color="blue" />}
                    />

                    <NavLink
                      href={`/instructor/courses/${group.courseId}/homework`}
                      icon={ClipboardCheck}
                      label="Homework"
                      badge={<AttentionBadge count={coursePendingHw} color="orange" />}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Empty state */}
          {courseGroups.length === 0 && (
            <p className="px-2.5 py-3 text-xs text-gray-400">No modules assigned yet.</p>
          )}
        </nav>

        {/* Bottom: user */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-2">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}

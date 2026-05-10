'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { useCourses } from '@/lib/hooks/useCourses'
import { CoursesTable } from '@/components/curriculum/CoursesTable'

export default function AdminCoursesPage() {
  const schoolId = useAuthStore((s) => s.schoolId) ?? ''
  const { data, isLoading } = useCourses(schoolId)

  return <CoursesTable courses={data ?? []} isLoading={isLoading} />
}

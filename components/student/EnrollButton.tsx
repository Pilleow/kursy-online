'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/authStore'

interface EnrollButtonProps {
  courseId: string
  courseSlug: string
  schoolSlug: string
  isFree: boolean
}

type EnrollmentStatus = 'loading' | 'enrolled' | 'not-enrolled' | 'unauthenticated'

export function EnrollButton({ courseId, courseSlug, schoolSlug, isFree }: EnrollButtonProps) {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [status, setStatus] = useState<EnrollmentStatus>('loading')
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !accessToken) {
      setStatus('unauthenticated')
      return
    }

    let cancelled = false
    fetch(`/api/v1/enrollments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (cancelled) return
        if (r.status === 401) {
          setStatus('unauthenticated')
          return
        }
        const enrollments: Array<{ course: { id: string } }> = await r.json()
        const found = Array.isArray(enrollments) && enrollments.some((e) => e.course.id === courseId)
        setStatus(found ? 'enrolled' : 'not-enrolled')
      })
      .catch(() => {
        if (!cancelled) setStatus('not-enrolled')
      })

    return () => {
      cancelled = true
    }
  }, [user, accessToken, courseId])

  async function handleFreeEnroll() {
    if (!accessToken) return
    setEnrolling(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ courseId }),
      })
      if (res.status === 401) {
        router.push(`/login?next=/courses/${schoolSlug}/${courseSlug}`)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Enrollment failed')
      }
      router.push(`/learn/${courseSlug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed')
      setEnrolling(false)
    }
  }

  if (status === 'loading') {
    return (
      <Button className="w-full" disabled>
        Loading…
      </Button>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Button className="w-full" asChild>
        <Link href={`/login?next=/courses/${schoolSlug}/${courseSlug}`}>Sign in to Enroll</Link>
      </Button>
    )
  }

  if (status === 'enrolled') {
    return (
      <Button className="w-full" variant="secondary" asChild>
        <Link href={`/learn/${courseSlug}`}>Continue Learning →</Link>
      </Button>
    )
  }

  // not enrolled
  if (!isFree) {
    return (
      <Button className="w-full" asChild>
        <Link href={`/checkout/${courseId}`}>Enroll Now</Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" onClick={handleFreeEnroll} disabled={enrolling}>
        {enrolling ? 'Enrolling…' : 'Enroll for Free'}
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  )
}

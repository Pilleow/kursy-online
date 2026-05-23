'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseDetail = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  priceUsd: string | number | null
  status: string
}

type CouponResult = {
  code: string
  discountPct: number
  courseId: string | null
}

// ─── CouponInput ──────────────────────────────────────────────────────────────

function CouponInput({
  onApply,
}: {
  onApply: (coupon: CouponResult | null) => void
}) {
  const { accessToken } = useAuthStore()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleApply() {
    const trimmed = code.trim()
    if (!trimmed) return
    setStatus('loading')
    setMessage(null)

    try {
      const res = await fetch(
        `/api/v1/school/coupons?code=${encodeURIComponent(trimmed)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )

      if (!res.ok) {
        setStatus('invalid')
        setMessage('Coupon not found or expired.')
        onApply(null)
        return
      }

      const coupon: CouponResult = await res.json()
      setStatus('valid')
      setMessage(`${coupon.discountPct}% discount applied!`)
      onApply(coupon)
    } catch {
      setStatus('invalid')
      setMessage('Could not validate coupon. Try again.')
      onApply(null)
    }
  }

  function handleClear() {
    setCode('')
    setStatus('idle')
    setMessage(null)
    onApply(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Coupon code</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            if (status !== 'idle') {
              setStatus('idle')
              setMessage(null)
              onApply(null)
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          disabled={status === 'loading'}
          className="flex-1"
        />
        {status === 'valid' ? (
          <Button variant="outline" onClick={handleClear} type="button">
            Remove
          </Button>
        ) : (
          <Button
            onClick={handleApply}
            disabled={!code.trim() || status === 'loading'}
            type="button"
            variant="outline"
          >
            {status === 'loading' ? 'Checking…' : 'Apply'}
          </Button>
        )}
      </div>
      {message && (
        <p
          className={`text-sm ${
            status === 'valid' ? 'text-emerald-600 font-medium' : 'text-destructive'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}

// ─── PriceSummary ─────────────────────────────────────────────────────────────

function PriceSummary({
  priceUsd,
  coupon,
}: {
  priceUsd: number
  coupon: CouponResult | null
}) {
  const discount = coupon ? priceUsd * (coupon.discountPct / 100) : 0
  const finalPrice = priceUsd - discount

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Original price</span>
        <span>${priceUsd.toFixed(2)}</span>
      </div>
      {coupon && (
        <div className="flex justify-between text-sm text-emerald-600 font-medium">
          <span>Coupon ({coupon.code}, {coupon.discountPct}% off)</span>
          <span>−${discount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold text-foreground border-t border-border pt-2">
        <span>Total</span>
        <span className={coupon ? 'text-emerald-600' : undefined}>${finalPrice.toFixed(2)}</span>
      </div>
    </div>
  )
}

// ─── PaymentSection ───────────────────────────────────────────────────────────

function PaymentSection({
  onPay,
  paying,
}: {
  onPay: () => void
  paying: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* TODO: Replace simulated payment with Stripe checkout.
          Integration point: create a PaymentIntent server-side, pass clientSecret
          to <Elements> provider, render <PaymentElement>, and on confirm call
          POST /api/v1/enrollments with the confirmed PaymentIntent ID. */}
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground text-center">
        Payment processing via Stripe — integration point
      </div>
      <Button className="w-full" onClick={onPay} disabled={paying}>
        {paying ? 'Processing…' : 'Pay Now (simulated)'}
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const { accessToken } = useAuthStore()

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [coupon, setCoupon] = useState<CouponResult | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  // Guard against double-fetch in StrictMode
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    if (!accessToken) {
      router.replace(`/login?callbackUrl=/checkout/${courseId}`)
      return
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    // Fetch course details and enrollment list in parallel
    Promise.all([
      fetch(`/api/v1/courses/${courseId}`, { headers }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Course not found')),
      ),
      fetch('/api/v1/enrollments', { headers }).then((r) =>
        r.ok ? r.json() : ([] as Array<{ course: { id: string; slug: string } }>),
      ),
    ])
      .then(([courseData, enrollments]: [CourseDetail, Array<{ course: { id: string; slug: string } }>]) => {
        // Already enrolled — skip checkout entirely
        const existing = Array.isArray(enrollments)
          ? enrollments.find((e) => e.course.id === courseId)
          : null
        if (existing) {
          router.replace(`/learn/${existing.course.slug}`)
          return
        }
        setCourse(courseData)
      })
      .catch((err: Error) => setLoadError(err.message))
  }, [accessToken, courseId, router])

  async function handleEnroll(couponCode?: string) {
    if (!accessToken || !course) return
    setEnrolling(true)
    setEnrollError(null)

    try {
      const res = await fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ courseId, ...(couponCode ? { couponCode } : {}) }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Enrollment failed')
      }

      router.push(`/learn/${course.slug}`)
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Enrollment failed')
      setEnrolling(false)
    }
  }

  function handleFreeEnroll() {
    handleEnroll()
  }

  function handlePaidEnroll() {
    // TODO: Stripe checkout — replace this with a real Stripe PaymentIntent confirmation
    // before calling the enrollment API. See POST /api/v1/enrollments for the expected
    // payment verification flow.
    handleEnroll(coupon?.code)
  }

  // ─── Loading / error states ───────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">{loadError}</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  const priceUsd = course.priceUsd !== null ? Number(course.priceUsd) : 0
  const isFree = priceUsd === 0

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{course.title}</p>

      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6 shadow-sm">
        {isFree ? (
          // Free course — direct enroll, no payment needed
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <span className="text-3xl font-bold text-emerald-600">Free</span>
            </div>
            <Button className="w-full" onClick={handleFreeEnroll} disabled={enrolling}>
              {enrolling ? 'Enrolling…' : 'Enroll Now'}
            </Button>
            {enrollError && (
              <p className="text-sm text-destructive text-center">{enrollError}</p>
            )}
          </div>
        ) : (
          // Paid course — coupon + price summary + payment (simulated)
          <>
            <CouponInput onApply={setCoupon} />
            <PriceSummary priceUsd={priceUsd} coupon={coupon} />
            <PaymentSection onPay={handlePaidEnroll} paying={enrolling} />
            {enrollError && (
              <p className="text-sm text-destructive text-center">{enrollError}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

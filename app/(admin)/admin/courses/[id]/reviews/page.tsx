'use client'

import { useParams } from 'next/navigation'
import { useState, useRef } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useCourseReviews, useApproveReview, useRejectReview } from '@/lib/hooks/useCourses'
import { DiffViewer } from '@/components/curriculum/DiffViewer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ContentReviewWithRelations } from '@/lib/api/courses'
import { cn } from '@/lib/utils'

function ReviewCard({
  review,
  courseId,
}: {
  review: ContentReviewWithRelations
  courseId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [comment, setComment] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const approve = useApproveReview(courseId)
  const reject = useRejectReview(courseId)
  const isBusy = approve.isPending || reject.isPending

  const instructorName = `${review.instructor.firstName} ${review.instructor.lastName}`

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  function handleApprove() {
    approve.mutate(review.id)
  }

  function handleRejectSubmit() {
    if (!comment.trim()) return
    reject.mutate(
      { reviewId: review.id, comment: comment.trim() },
      { onSuccess: () => { setRejecting(false); setComment('') } },
    )
  }

  function handleRejectOpen() {
    setRejecting(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const oldBlocks = review.lesson.blocks ?? []
  const newBlocks = (review.changeSnapshot as ContentReviewWithRelations['changeSnapshot']) ?? []

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Toggle diff"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
            {review.lesson.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {instructorName} &middot; {timeAgo(review.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!rejecting && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectOpen}
                disabled={isBusy}
                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950"
              >
                {reject.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                Reject
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isBusy}
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                {approve.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Inline reject textarea */}
      {rejecting && (
        <div className="px-4 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-xs font-medium text-gray-500">Rejection reason (required)</p>
          <Textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain what needs to be changed…"
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setRejecting(false); setComment('') }}
              disabled={reject.isPending}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRejectSubmit}
              disabled={!comment.trim() || reject.isPending}
              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {reject.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Send rejection
            </Button>
          </div>
        </div>
      )}

      {/* Diff panel */}
      {expanded && (
        <div
          className={cn(
            'px-4 pb-4',
            !rejecting && 'border-t border-gray-100 dark:border-gray-800 pt-3',
          )}
        >
          <DiffViewer oldBlocks={oldBlocks} newBlocks={newBlocks} />
        </div>
      )}
    </div>
  )
}

export default function AdminCourseReviewsPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { data: reviews, isLoading, isError } = useCourseReviews(courseId)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Review Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pending instructor submissions waiting for approval.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reviews…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600">
          Failed to load reviews. Try refreshing the page.
        </div>
      )}

      {!isLoading && !isError && reviews?.length === 0 && (
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            No lessons pending review.
          </div>
        </div>
      )}

      {!isLoading && !isError && reviews && reviews.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {reviews.length} pending review{reviews.length !== 1 ? 's' : ''}
          </p>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} courseId={courseId} />
          ))}
        </div>
      )}
    </div>
  )
}

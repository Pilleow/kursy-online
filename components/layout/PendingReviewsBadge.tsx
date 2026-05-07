'use client'

import { usePendingReviewsCount } from '@/lib/hooks/useAdminStats'

export function PendingReviewsBadge({ schoolId }: { schoolId: string | null }) {
  const { data } = usePendingReviewsCount(schoolId)
  const count = data?.count ?? 0

  if (count === 0) return null

  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

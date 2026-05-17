'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Remaining = {
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function computeRemaining(until: string): Remaining {
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
  const totalSec = Math.floor(ms / 1000)
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    expired: false,
  }
}

type Props = {
  cooldownUntil: string
  onRetry: () => void
}

export function CooldownMessage({ cooldownUntil, onRetry }: Props) {
  const [remaining, setRemaining] = useState<Remaining>(() => computeRemaining(cooldownUntil))

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeRemaining(cooldownUntil)), 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  if (remaining.expired) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <Clock className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cooldown Ended</h2>
          <p className="mt-1 text-sm text-gray-500">You&apos;re ready to try again!</p>
        </div>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    )
  }

  const parts: string[] = []
  if (remaining.hours > 0) {
    parts.push(`${remaining.hours} hour${remaining.hours !== 1 ? 's' : ''}`)
  }
  if (remaining.minutes > 0 || remaining.hours > 0) {
    parts.push(`${remaining.minutes} minute${remaining.minutes !== 1 ? 's' : ''}`)
  }
  if (remaining.hours === 0) {
    parts.push(`${remaining.seconds} second${remaining.seconds !== 1 ? 's' : ''}`)
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
        <Clock className="h-10 w-10 text-amber-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Cooldown Active</h2>
        <p className="mt-1 text-sm text-gray-500">You can try again in</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-amber-600">
          {parts.join(' ')}
        </p>
      </div>
    </div>
  )
}

'use client'

type Props = {
  percent: number
  className?: string
}

export function ProgressTracker({ percent, className }: Props) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className={`w-full ${className ?? ''}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Progress</span>
        <span className="text-xs font-medium text-gray-600">{clamped}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'

export type Category = 'all' | 'free' | 'paid'

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'paid' },
]

interface CategoryFilterProps {
  active: Category
  onChange: (category: Category) => void
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
            active === value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-accent',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { CourseCard } from './CourseCard'
import { CategoryFilter, type Category } from './CategoryFilter'
import { SearchBar } from './SearchBar'

export type PublicCourse = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  priceUsd: number | null
  instructor: string | null
  school: { name: string }
}

interface CourseGridProps {
  courses: PublicCourse[]
}

export function CourseGrid({ courses }: CourseGridProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('all')

  const handleSearch = useCallback((value: string) => setSearch(value), [])
  const handleCategory = useCallback((value: Category) => setCategory(value), [])

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      category === 'all' ||
      (category === 'free' && (c.priceUsd === null || c.priceUsd === 0)) ||
      (category === 'paid' && c.priceUsd !== null && c.priceUsd > 0)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <SearchBar value={search} onChange={handleSearch} />
        <CategoryFilter active={category} onChange={handleCategory} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No courses found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listAdminEnrollments,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/lib/api/school'

// ─── Admin enrollments ────────────────────────────────────────────────────────

export function useAdminEnrollments(params?: {
  page?: number
  limit?: number
  courseId?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: ['admin', 'enrollments', params],
    queryFn: () => listAdminEnrollments(params),
  })
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export function useCoupons() {
  return useQuery({
    queryKey: ['school', 'coupons'],
    queryFn: listCoupons,
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school', 'coupons'] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof updateCoupon>[1] & { id: string }) =>
      updateCoupon(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school', 'coupons'] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school', 'coupons'] }),
  })
}

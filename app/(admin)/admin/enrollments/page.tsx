'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnrollmentsTable } from '@/components/curriculum/EnrollmentsTable'
import { CouponManager } from '@/components/curriculum/CouponManager'

export default function AdminEnrollmentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Enrollments &amp; Coupons</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track course enrollments, payments, and manage discount codes.
        </p>
      </div>

      <Tabs defaultValue="enrollments">
        <TabsList className="mb-6">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <EnrollmentsTable />
        </TabsContent>

        <TabsContent value="coupons">
          <CouponManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

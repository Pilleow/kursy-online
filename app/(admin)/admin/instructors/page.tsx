'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InstructorsTable } from '@/components/curriculum/InstructorsTable'
import { InviteInstructorModal } from '@/components/curriculum/InviteInstructorModal'
import { useSchoolInstructors } from '@/lib/hooks/useSchoolInstructors'

export default function AdminInstructorsPage() {
  const { data: instructors, isLoading } = useSchoolInstructors()
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Instructors</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage instructor team members and their module assignments.
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite instructor
        </Button>
      </div>

      <InstructorsTable instructors={instructors} isLoading={isLoading} />

      <InviteInstructorModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}

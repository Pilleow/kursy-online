'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useInviteInstructor } from '@/lib/hooks/useSchoolInstructors'
import { useToast } from '@/hooks/use-toast'

const Schema = z.object({ email: z.string().email('Enter a valid email address') })
type Values = z.infer<typeof Schema>

const statusMessages: Record<string, string> = {
  invited: 'Invitation sent — the user will receive an email to join as instructor.',
  promoted: 'User promoted to instructor.',
  added: 'User added to the school as instructor.',
}

export function InviteInstructorModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const invite = useInviteInstructor()
  const { toast } = useToast()

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' },
  })

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const onSubmit = async (values: Values) => {
    try {
      const result = await invite.mutateAsync(values.email)
      toast({
        title: 'Success',
        description: statusMessages[result.status] ?? 'Done.',
      })
      handleClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not invite instructor'
      toast({ title: 'Failed', description: msg, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite instructor</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">
          Enter the email address of the person you want to add as an instructor. If they already
          have an account they will be promoted; otherwise an invitation will be sent.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="instructor@example.com"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending ? 'Sending…' : 'Send invite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitFeedback } from '@/lib/api/homework'

type Props = {
  submissionId: string
  onSuccess: () => void
}

export function FeedbackForm({ submissionId, onSuccess }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      await submitFeedback(submissionId, { feedback: trimmed })
      onSuccess()
    } catch {
      setError('Failed to send feedback. Please try again.')
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Write feedback for this student…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="resize-y"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={sending || !text.trim()}>
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Sending…' : 'Send Feedback'}
        </Button>
      </div>
    </div>
  )
}

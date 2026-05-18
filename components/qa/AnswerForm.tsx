'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/authStore'
import { useAnswerQuestion } from '@/lib/hooks/useQA'

type Props = {
  questionId: string
  lessonId: string
  existingAnswer?: string
}

export function AnswerForm({ questionId, lessonId, existingAnswer }: Props) {
  const role = useAuthStore((s) => s.role)
  const [text, setText] = useState(existingAnswer ?? '')
  const [open, setOpen] = useState(false)
  const { mutate, isPending } = useAnswerQuestion(lessonId)

  if (role !== 'instructor' && role !== 'school_admin') return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        {existingAnswer ? 'Edit answer' : 'Answer'}
      </button>
    )
  }

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    mutate(
      { questionId, body: { text: trimmed } },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <div className="space-y-2 pt-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={existingAnswer ? 'Update your answer…' : 'Write an answer…'}
        rows={3}
        className="w-full resize-none rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-50"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isPending || !text.trim()}>
          {isPending ? 'Sending…' : 'Send answer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

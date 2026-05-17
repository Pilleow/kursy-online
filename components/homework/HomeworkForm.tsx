'use client'

import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { HomeworkWithQuestions } from '@/lib/api/homework'

type Question = HomeworkWithQuestions['questions'][number]

type FormValues = Record<string, string>

type Props = {
  homework: HomeworkWithQuestions
  onSubmit: (answers: Record<string, string>) => Promise<void>
  submitting?: boolean
  error?: string | null
  readOnly?: boolean
  existingAnswers?: Record<string, string>
}

export function HomeworkForm({
  homework,
  onSubmit,
  submitting = false,
  error,
  readOnly = false,
  existingAnswers,
}: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existingAnswers ?? {},
  })

  async function submit(values: FormValues) {
    const answers: Record<string, string> = {}
    for (const q of homework.questions) {
      answers[q.id] = values[q.id] ?? ''
    }
    await onSubmit(answers)
  }

  function renderQuestion(q: Question, idx: number) {
    const qError = errors[q.id]?.message as string | undefined
    const isChoice = q.type === 'single_choice' || q.type === 'multiple_choice'
    const options: string[] = Array.isArray(q.options) ? q.options : []

    return (
      <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <p className="text-sm font-medium text-gray-900">
          <span className="text-gray-400 mr-2">{idx + 1}.</span>
          {q.text}
          {q.required && !readOnly && <span className="text-red-500 ml-1">*</span>}
        </p>

        <Controller
          control={control}
          name={q.id}
          defaultValue={existingAnswers?.[q.id] ?? ''}
          render={({ field }) => {
            if (q.type === 'single_choice') {
              return (
                <div className="flex flex-col gap-2">
                  {options.map((opt) => {
                    const isSelected = field.value === opt
                    if (readOnly) {
                      return (
                        <div
                          key={opt}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm',
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-gray-100 text-gray-400',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                              isSelected ? 'border-primary bg-primary' : 'border-gray-200',
                            )}
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          {opt}
                        </div>
                      )
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => field.onChange(opt)}
                        className={cn(
                          'flex items-center gap-3 w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white',
                          )}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )
            }

            if (q.type === 'multiple_choice') {
              const selected = field.value ? field.value.split(',').filter(Boolean) : []
              const toggle = (opt: string) => {
                const next = selected.includes(opt)
                  ? selected.filter((o) => o !== opt)
                  : [...selected, opt]
                field.onChange(next.join(','))
              }
              return (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400">Select all that apply</p>
                  {options.map((opt) => {
                    const checked = selected.includes(opt)
                    if (readOnly) {
                      return (
                        <div
                          key={opt}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm',
                            checked
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-gray-100 text-gray-400',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2',
                              checked ? 'border-primary bg-primary' : 'border-gray-200',
                            )}
                          >
                            {checked && (
                              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                                <path
                                  d="M1 4l3 3 5-6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          {opt}
                        </div>
                      )
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        className={cn(
                          'flex items-center gap-3 w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                          checked
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                            checked ? 'border-primary bg-primary' : 'border-gray-300 bg-white',
                          )}
                        >
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4l3 3 5-6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )
            }

            // 'text' | 'file_upload'
            return (
              <textarea
                {...field}
                readOnly={readOnly}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'resize-y min-h-[80px]',
                  readOnly && 'bg-gray-50 cursor-default border-gray-100',
                )}
                placeholder={
                  readOnly
                    ? ''
                    : q.type === 'file_upload'
                    ? 'Paste a link or describe your upload…'
                    : 'Write your answer…'
                }
              />
            )
          }}
        />

        {!isChoice && qError && !readOnly && (
          <p className="text-xs text-red-500">{qError}</p>
        )}
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="flex flex-col gap-5">
        {homework.questions.map((q, idx) => renderQuestion(q, idx))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <div className="flex flex-col gap-5">
        {homework.questions.map((q, idx) => renderQuestion(q, idx))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Homework'}
        </Button>
      </div>
    </form>
  )
}

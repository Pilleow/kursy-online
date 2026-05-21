'use client'

import { useCallback, useEffect, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createOrGetHomeworkForLesson,
  getHomework,
  updateHomework,
} from '@/lib/api/homework'
import { DeleteBlockButton } from './DeleteBlockButton'

// ─── Local types ───────────────────────────────────────────────────────────────

type QuestionType = 'open' | 'single_choice' | 'multiple_choice'

type LocalOption = { id: string; text: string }

type LocalQuestion = {
  id: string
  text: string
  type: QuestionType
  options: LocalOption[]
}

type ValidationError = { questionIndex: number; message: string }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function newOption(): LocalOption {
  return { id: uid(), text: '' }
}

function newQuestion(): LocalQuestion {
  return { id: uid(), text: '', type: 'open', options: [] }
}

function parseServerQuestions(
  questions: { id: string; text: string; type: string; options: string[] | null }[],
): LocalQuestion[] {
  return questions.map((q) => {
    const type: QuestionType =
      q.type === 'single_choice'
        ? 'single_choice'
        : q.type === 'multiple_choice'
          ? 'multiple_choice'
          : 'open'
    return {
      id: q.id,
      text: q.text,
      type,
      options:
        type !== 'open' && q.options
          ? q.options.map((text) => ({ id: uid(), text }))
          : [],
    }
  })
}

function toApiQuestions(questions: LocalQuestion[]) {
  return questions.map((q, i) => ({
    text: q.text,
    type: q.type === 'open' ? ('text' as const) : q.type,
    options: q.type !== 'open' ? q.options.map((o) => o.text) : [],
    position: i,
    required: true,
  }))
}

function validate(questions: LocalQuestion[]): ValidationError[] {
  const errors: ValidationError[] = []
  questions.forEach((q, i) => {
    if (!q.text.trim()) {
      errors.push({ questionIndex: i, message: 'Question text is required' })
    } else if (q.type !== 'open' && q.options.length < 2) {
      errors.push({ questionIndex: i, message: 'At least 2 options required' })
    }
  })
  return errors
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Saved
      </span>
    )
  if (status === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    )
  if (status === 'error')
    return (
      <span className="flex items-center gap-1 text-xs text-red-500">
        <AlertCircle className="h-3.5 w-3.5" />
        Save failed
      </span>
    )
  return null
}

// ─── Edit mode ─────────────────────────────────────────────────────────────────

type EditModeProps = {
  questions: LocalQuestion[]
  errors: ValidationError[]
  onUpdateQuestion: (i: number, patch: Partial<LocalQuestion>) => void
  onRemoveQuestion: (i: number) => void
  onAddOption: (qIndex: number) => void
  onRemoveOption: (qIndex: number, oIndex: number) => void
  onUpdateOption: (qIndex: number, oIndex: number, text: string) => void
  onAddQuestion: () => void
}

function EditMode({
  questions,
  errors,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onAddQuestion,
}: EditModeProps) {
  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => {
        const qErrors = errors.filter((e) => e.questionIndex === qIndex)
        const isChoice = q.type === 'single_choice' || q.type === 'multiple_choice'

        return (
          <div
            key={q.id}
            className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/30"
          >
            {/* Question row */}
            <div className="mb-3 flex items-start gap-2">
              <span className="mt-2.5 shrink-0 text-xs font-medium text-gray-400">
                Q{qIndex + 1}
              </span>
              <Input
                placeholder="Question text…"
                value={q.text}
                onChange={(e) => onUpdateQuestion(qIndex, { text: e.target.value })}
                className="flex-1 text-sm"
              />
              <Select
                value={q.type}
                onValueChange={(v) => {
                  const type = v as QuestionType
                  const options =
                    type === 'open'
                      ? []
                      : q.options.length >= 2
                        ? q.options
                        : [newOption(), newOption()]
                  onUpdateQuestion(qIndex, { type, options })
                }}
              >
                <SelectTrigger className="h-9 w-40 shrink-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open answer</SelectItem>
                  <SelectItem value="single_choice">Single choice</SelectItem>
                  <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-gray-400 hover:text-red-500"
                onClick={() => onRemoveQuestion(qIndex)}
                disabled={questions.length === 1}
                title="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Open question hint */}
            {!isChoice && (
              <div className="ml-7">
                <Textarea
                  readOnly
                  placeholder="Students will type their answer here…"
                  className="min-h-[60px] cursor-default resize-none text-sm text-gray-400"
                />
              </div>
            )}

            {/* Options for choice questions */}
            {isChoice && (
              <div className="ml-7 space-y-2">
                {q.options.map((opt, oIndex) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    {q.type === 'single_choice' ? (
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded border-2 border-gray-300 dark:border-gray-600" />
                    )}
                    <Input
                      placeholder={`Option ${oIndex + 1}…`}
                      value={opt.text}
                      onChange={(e) => onUpdateOption(qIndex, oIndex, e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500"
                      onClick={() => onRemoveOption(qIndex, oIndex)}
                      disabled={q.options.length <= 2}
                      title="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 pl-0 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => onAddOption(qIndex)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </Button>
              </div>
            )}

            {qErrors.map((err, i) => (
              <p
                key={i}
                className="mt-2 ml-7 flex items-center gap-1 text-xs text-red-500"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {err.message}
              </p>
            ))}
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={onAddQuestion}
      >
        <Plus className="h-3.5 w-3.5" />
        Add question
      </Button>
    </div>
  )
}

// ─── Preview mode ──────────────────────────────────────────────────────────────

function PreviewMode({ questions }: { questions: LocalQuestion[] }) {
  if (questions.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400">
        No questions yet. Switch to Edit to add some.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const isChoice = q.type === 'single_choice' || q.type === 'multiple_choice'
        return (
          <div
            key={q.id}
            className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
          >
            <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-100">
              <span className="mr-2 text-xs font-normal text-gray-400">Q{i + 1}</span>
              {q.text || <span className="italic text-gray-400">No question text</span>}
            </p>

            {!isChoice && (
              <div className="ml-5">
                <div className="min-h-[40px] rounded border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400 dark:border-gray-700">
                  Open answer field
                </div>
              </div>
            )}

            {isChoice && (
              <div className="ml-5 space-y-1">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {q.type === 'single_choice' ? (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded border border-gray-300 dark:border-gray-600" />
                    )}
                    {opt.text || <span className="italic opacity-50">Empty option</span>}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-1 ml-5 text-xs text-gray-400">
              {q.type === 'open'
                ? 'Open answer'
                : q.type === 'single_choice'
                  ? 'Single choice'
                  : 'Multiple choice'}
              {' · manually graded'}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── HomeworkBlock NodeView ────────────────────────────────────────────────────

export function HomeworkBlock({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const homeworkId = node.attrs.homeworkId as string | null
  const lessonId = node.attrs.lessonId as string | null

  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [questions, setQuestions] = useState<LocalQuestion[]>([newQuestion()])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [resolvedId, setResolvedId] = useState<string | null>(homeworkId)

  // ─── Init: ensure homework exists, then hydrate questions ──────────────────

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      try {
        let id = homeworkId
        if (!id) {
          if (!lessonId) {
            setInitError('No homework ID — re-insert this block via the / menu')
            return
          }
          const hw = await createOrGetHomeworkForLesson(lessonId)
          if (cancelled) return
          updateAttributes({ homeworkId: hw.id })
          id = hw.id
          setResolvedId(hw.id)
        }
        const hw = await getHomework(id)
        if (cancelled) return
        if (hw.questions.length > 0) {
          setQuestions(parseServerQuestions(hw.questions))
        }
      } catch (err) {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : 'Failed to load homework')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run only on mount

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const id = resolvedId
    if (!id) return

    const errs = validate(questions)
    setErrors(errs)
    if (errs.length > 0) return

    setSaveStatus('saving')
    try {
      await updateHomework(id, { questions: toApiQuestions(questions) })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
    }
  }, [questions, resolvedId])

  // ─── Question mutators ─────────────────────────────────────────────────────

  function updateQuestion(index: number, patch: Partial<LocalQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
    setErrors((e) => e.filter((err) => err.questionIndex !== index))
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, newQuestion()])
  }

  function removeQuestion(index: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== index))
    setErrors((e) =>
      e
        .filter((err) => err.questionIndex !== index)
        .map((err) => ({
          ...err,
          questionIndex:
            err.questionIndex > index ? err.questionIndex - 1 : err.questionIndex,
        })),
    )
  }

  function addOption(qIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, newOption()] } : q,
      ),
    )
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex) return q
        return { ...q, options: q.options.filter((_, j) => j !== oIndex) }
      }),
    )
  }

  function updateOption(qIndex: number, oIndex: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex) return q
        return {
          ...q,
          options: q.options.map((o, j) => (j === oIndex ? { ...o, text } : o)),
        }
      }),
    )
  }

  // ─── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <NodeViewWrapper>
        <div className="my-2 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/40">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span className="text-sm text-gray-500">Loading homework…</span>
        </div>
      </NodeViewWrapper>
    )
  }

  if (initError) {
    return (
      <NodeViewWrapper>
        <div className="my-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">{initError}</span>
        </div>
      </NodeViewWrapper>
    )
  }

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <NodeViewWrapper>
      <div
        className="my-3 rounded-xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/40 dark:bg-gray-900"
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 px-4 py-3 dark:border-amber-900/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <ClipboardList className="h-4 w-4 text-amber-500" />
            Homework
          </div>

          <div className="flex items-center gap-2">
            <SaveBadge status={saveStatus} />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
            >
              {mode === 'edit' ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </>
              )}
            </Button>

            {mode === 'edit' && (
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1.5 bg-amber-500 text-xs text-white hover:bg-amber-600"
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            )}

            <DeleteBlockButton label="homework" onConfirm={deleteNode} />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {mode === 'edit' ? (
            <EditMode
              questions={questions}
              errors={errors}
              onUpdateQuestion={updateQuestion}
              onRemoveQuestion={removeQuestion}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onUpdateOption={updateOption}
              onAddQuestion={addQuestion}
            />
          ) : (
            <PreviewMode questions={questions} />
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createOrGetQuizForLesson,
  getQuiz,
  updateQuizQuestions,
} from '@/lib/api/quizzes'
import type { QuizQuestion } from '@/lib/types'
import { DeleteBlockButton } from './DeleteBlockButton'

// ─── Local types ───────────────────────────────────────────────────────────────

type LocalOption = { id: string; text: string; isCorrect: boolean }

type LocalQuestion = {
  id: string
  text: string
  type: 'single_choice' | 'multiple_choice'
  options: LocalOption[]
}

type ValidationError = { questionIndex: number; message: string }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function newOption(): LocalOption {
  return { id: uid(), text: '', isCorrect: false }
}

function newQuestion(): LocalQuestion {
  return {
    id: uid(),
    text: '',
    type: 'single_choice',
    options: [newOption(), newOption()],
  }
}

function parseServerQuestions(questions: QuizQuestion[]): LocalQuestion[] {
  return questions.map((q) => {
    const correctAnswers = q.correctAnswer?.split('|') ?? []
    return {
      id: q.id,
      text: q.text,
      type: correctAnswers.length > 1 ? 'multiple_choice' : 'single_choice',
      options:
        q.options.length > 0
          ? q.options.map((opt) => ({
              id: uid(),
              text: opt,
              isCorrect: correctAnswers.includes(opt),
            }))
          : [newOption(), newOption()],
    }
  })
}

function toApiQuestions(questions: LocalQuestion[]) {
  return questions.map((q, i) => ({
    text: q.text,
    type: 'multiple_choice' as const,
    options: q.options.map((o) => o.text),
    correctAnswer: q.options
      .filter((o) => o.isCorrect)
      .map((o) => o.text)
      .join('|'),
    position: i,
    points: 1,
  }))
}

function validate(questions: LocalQuestion[]): ValidationError[] {
  const errors: ValidationError[] = []
  questions.forEach((q, i) => {
    if (q.options.length < 2) {
      errors.push({ questionIndex: i, message: 'At least 2 options required' })
    } else if (!q.options.some((o) => o.isCorrect)) {
      errors.push({ questionIndex: i, message: 'Mark at least 1 correct answer' })
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
  onUpdateOption: (qIndex: number, oIndex: number, patch: Partial<LocalOption>) => void
  onToggleCorrect: (qIndex: number, oIndex: number) => void
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
  onToggleCorrect,
  onAddQuestion,
}: EditModeProps) {
  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => {
        const qErrors = errors.filter((e) => e.questionIndex === qIndex)
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
                  const type = v as 'single_choice' | 'multiple_choice'
                  const options =
                    type === 'single_choice'
                      ? (() => {
                          const firstCorrectIdx = q.options.findIndex((o) => o.isCorrect)
                          return q.options.map((o, i) => ({
                            ...o,
                            isCorrect: i === firstCorrectIdx,
                          }))
                        })()
                      : q.options
                  onUpdateQuestion(qIndex, { type, options })
                }}
              >
                <SelectTrigger className="h-9 w-38 shrink-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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

            {/* Options */}
            <div className="ml-7 space-y-2">
              {q.options.map((opt, oIndex) => (
                <div key={opt.id} className="flex items-center gap-2">
                  {q.type === 'single_choice' ? (
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={opt.isCorrect}
                      onChange={() => onToggleCorrect(qIndex, oIndex)}
                      className="h-4 w-4 shrink-0 accent-green-500"
                      title="Mark as correct"
                    />
                  ) : (
                    <Checkbox
                      checked={opt.isCorrect}
                      onCheckedChange={() => onToggleCorrect(qIndex, oIndex)}
                      className="h-4 w-4 shrink-0 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
                    />
                  )}
                  <Input
                    placeholder={`Option ${oIndex + 1}…`}
                    value={opt.text}
                    onChange={(e) =>
                      onUpdateOption(qIndex, oIndex, { text: e.target.value })
                    }
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

            {/* Validation errors for this question */}
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
      {questions.map((q, i) => (
        <div
          key={q.id}
          className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
        >
          <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-100">
            <span className="mr-2 text-xs font-normal text-gray-400">Q{i + 1}</span>
            {q.text || (
              <span className="italic text-gray-400">No question text</span>
            )}
          </p>
          <div className="ml-5 space-y-1">
            {q.options.map((opt) => (
              <div
                key={opt.id}
                className={[
                  'flex items-center gap-2 rounded-md px-2 py-1 text-sm',
                  opt.isCorrect
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-400',
                ].join(' ')}
              >
                {opt.isCorrect ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" />
                )}
                {opt.text || (
                  <span className="italic opacity-50">Empty option</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 ml-5 text-xs text-gray-400">
            {q.type === 'single_choice' ? 'Single choice' : 'Multiple choice'}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── QuizBlock NodeView ────────────────────────────────────────────────────────

export function QuizBlock({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const quizId = node.attrs.quizId as string | null
  const lessonId = node.attrs.lessonId as string | null

  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [questions, setQuestions] = useState<LocalQuestion[]>([newQuestion()])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Track resolved quizId in state so it's available to handleSave after creation
  const [resolvedQuizId, setResolvedQuizId] = useState<string | null>(quizId)

  // ─── Init: ensure quiz exists, then hydrate questions ──────────────────────

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      try {
        let id = quizId
        if (!id) {
          if (!lessonId) {
            setInitError('No quiz ID — re-insert this block via the / menu')
            return
          }
          const quiz = await createOrGetQuizForLesson(lessonId)
          if (cancelled) return
          updateAttributes({ quizId: quiz.id })
          id = quiz.id
          setResolvedQuizId(quiz.id)
        }
        const quiz = await getQuiz(id)
        if (cancelled) return
        if (quiz.questions.length > 0) {
          setQuestions(parseServerQuestions(quiz.questions))
        }
      } catch (err) {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : 'Failed to load quiz')
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
    const id = resolvedQuizId
    if (!id) return

    const errs = validate(questions)
    setErrors(errs)
    if (errs.length > 0) return

    setSaveStatus('saving')
    try {
      await updateQuizQuestions(id, toApiQuestions(questions))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
    }
  }, [questions, resolvedQuizId])

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

  function updateOption(qIndex: number, oIndex: number, patch: Partial<LocalOption>) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex) return q
        return {
          ...q,
          options: q.options.map((o, j) => (j === oIndex ? { ...o, ...patch } : o)),
        }
      }),
    )
  }

  function toggleCorrect(qIndex: number, oIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex) return q
        const isSingle = q.type === 'single_choice'
        const options = q.options.map((o, j) => ({
          ...o,
          isCorrect: isSingle
            ? j === oIndex
            : j === oIndex
              ? !o.isCorrect
              : o.isCorrect,
        }))
        return { ...q, options }
      }),
    )
    setErrors((e) => e.filter((err) => err.questionIndex !== qIndex))
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

  // ─── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <NodeViewWrapper>
        <div className="my-2 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/40">
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
          <span className="text-sm text-gray-500">Loading quiz…</span>
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
        className="my-3 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
        // Prevent keystrokes from triggering Tiptap slash commands while editing
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <HelpCircle className="h-4 w-4 text-purple-500" />
            Quiz
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
                className="h-7 gap-1.5 text-xs"
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            )}

            <DeleteBlockButton label="quiz" onConfirm={deleteNode} />
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
              onToggleCorrect={toggleCorrect}
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

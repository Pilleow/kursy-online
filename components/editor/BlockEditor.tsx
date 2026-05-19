'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import debounce from 'lodash.debounce'
import { Save, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { QASectionNode } from './extensions/QASectionNode'
import { SlashCommand } from './extensions/SlashCommand'
import { buildSuggestion } from './CommandMenuList'
import { patchBlocks } from '@/lib/api/lessons'
import { useSubmitLessonForReview } from '@/lib/hooks/useLesson'
import type { Block } from '@/lib/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CONTENT_BLOCK_ID = 'tiptap-doc'

function blocksToContent(blocks: Block[]): object | null {
  const textBlock = blocks.find(
    (b): b is Extract<Block, { type: 'text' }> =>
      b.type === 'text' && b.id === CONTENT_BLOCK_ID,
  )
  if (!textBlock?.html) return null
  try {
    return JSON.parse(textBlock.html) as object
  } catch {
    return textBlock.html as unknown as object
  }
}

function contentToBlocks(json: object): Block[] {
  return [{ type: 'text', id: CONTENT_BLOCK_ID, html: JSON.stringify(json) }]
}

// ─── Save status ──────────────────────────────────────────────────────────────

type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error'

function SaveStatusBadge({ status }: { status: SaveStatus }) {
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
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">Unsaved changes</span>
  )
}

// ─── BlockEditor ──────────────────────────────────────────────────────────────

type Props = {
  lessonId: string
  initialBlocks: Block[]
  lessonStatus: 'draft' | 'pending_review' | 'published'
}

export function BlockEditor({ lessonId, initialBlocks, lessonStatus }: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    initialBlocks.length > 0 ? 'saved' : 'saved',
  )
  const { toast } = useToast()
  const { mutateAsync: submitForReview, isPending: isSubmitting } = useSubmitLessonForReview()

  // ─── Save logic ────────────────────────────────────────────────────────────

  const save = useCallback(
    async (json: object) => {
      setSaveStatus('saving')
      try {
        await patchBlocks(lessonId, contentToBlocks(json))
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
        toast({ title: 'Auto-save failed', variant: 'destructive' })
      }
    },
    [lessonId, toast],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((json: object) => {
      save(json)
    }, 30_000),
    [save],
  )

  // Flush on unmount so we don't lose last edits
  useEffect(() => () => debouncedSave.flush(), [debouncedSave])

  // ─── Editor ────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing, or type "/" for commands…',
      }),
      QASectionNode,
      SlashCommand.configure({
        suggestion: buildSuggestion(),
      }),
    ],
    content: blocksToContent(initialBlocks) ?? '',
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved')
      debouncedSave(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[400px] focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  // ─── Cmd+S ─────────────────────────────────────────────────────────────────

  const saveRef = useRef(save)
  saveRef.current = save

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!editor) return
        debouncedSave.cancel()
        saveRef.current(editor.getJSON())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editor, debouncedSave])

  // ─── Submit for review ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!editor) return
    debouncedSave.cancel()
    await save(editor.getJSON())
    try {
      await submitForReview(lessonId)
      toast({ title: 'Submitted for review' })
    } catch {
      toast({ title: 'Submission failed', variant: 'destructive' })
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <SaveStatusBadge status={saveStatus} />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              if (!editor) return
              debouncedSave.cancel()
              save(editor.getJSON())
            }}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          {lessonStatus === 'draft' && (
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Submitting…' : 'Submit for review'}
            </Button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

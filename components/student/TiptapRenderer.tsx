'use client'

import { QASection } from '@/components/qa/QASection'
import Link from 'next/link'
import { ListChecks, FileText } from 'lucide-react'

type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}

function nodeToHtml(node: TiptapNode): string {
  if (node.type === 'text') {
    let text = (node.text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        else if (mark.type === 'italic') text = `<em>${text}</em>`
        else if (mark.type === 'strike') text = `<s>${text}</s>`
        else if (mark.type === 'code') text = `<code>${text}</code>`
        else if (mark.type === 'link') {
          const href = mark.attrs?.href as string ?? '#'
          text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
        }
      }
    }
    return text
  }
  const inner = (node.content ?? []).map(nodeToHtml).join('')
  switch (node.type) {
    case 'paragraph':    return `<p>${inner || '<br>'}</p>`
    case 'heading':      return `<h${node.attrs?.level ?? 2}>${inner}</h${node.attrs?.level ?? 2}>`
    case 'bulletList':   return `<ul>${inner}</ul>`
    case 'orderedList':  return `<ol>${inner}</ol>`
    case 'listItem':     return `<li>${inner}</li>`
    case 'blockquote':   return `<blockquote>${inner}</blockquote>`
    case 'codeBlock':    return `<pre><code>${inner}</code></pre>`
    case 'hardBreak':    return '<br>'
    case 'horizontalRule': return '<hr>'
    default:             return inner
  }
}

const PROSE_TYPES = new Set([
  'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem',
  'blockquote', 'codeBlock', 'hardBreak', 'horizontalRule', 'text',
])

type Props = {
  tiptapJson: string
  lessonId: string
  courseSlug: string
}

export function TiptapRenderer({ tiptapJson, lessonId, courseSlug }: Props) {
  let doc: TiptapNode | null = null
  try { doc = JSON.parse(tiptapJson) as TiptapNode } catch { return null }
  if (!doc?.content?.length) return null

  const elements: React.ReactNode[] = []
  let proseBuffer: TiptapNode[] = []

  function flushProse() {
    if (proseBuffer.length === 0) return
    const html = proseBuffer.map(nodeToHtml).join('')
    elements.push(
      <div
        key={`prose-${elements.length}`}
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
    proseBuffer = []
  }

  for (const node of doc.content) {
    if (node.type === 'videoBlock') {
      flushProse()
      const url = node.attrs?.videoUrl as string | null
      const thumbnail = node.attrs?.thumbnail as string | null
      if (url) {
        elements.push(
          <figure key={`video-${elements.length}`} className="space-y-2">
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              <video src={url} poster={thumbnail ?? undefined} controls preload="metadata" className="w-full h-full" />
            </div>
          </figure>
        )
      }
    } else if (node.type === 'qaSection') {
      flushProse()
      elements.push(<QASection key={`qa-${elements.length}`} lessonId={lessonId} />)
    } else if (node.type === 'quizBlock') {
      flushProse()
      const quizId = node.attrs?.quizId as string | null
      if (quizId) {
        elements.push(
          <Link
            key={`quiz-${elements.length}`}
            href={`/learn/${courseSlug}/quiz/${quizId}?from=${lessonId}`}
            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors group"
          >
            <ListChecks className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium text-primary">Take Quiz</span>
          </Link>
        )
      }
    } else if (node.type === 'homeworkBlock') {
      flushProse()
      const homeworkId = node.attrs?.homeworkId as string | null
      if (homeworkId) {
        elements.push(
          <Link
            key={`hw-${elements.length}`}
            href={`/learn/${courseSlug}/homework/${homeworkId}?from=${lessonId}`}
            className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
          >
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Homework Assignment</span>
          </Link>
        )
      }
    } else if (PROSE_TYPES.has(node.type)) {
      proseBuffer.push(node)
    }
  }
  flushProse()

  return <>{elements}</>
}

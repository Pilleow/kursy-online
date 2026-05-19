'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Clock, Send, Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  listCourseHomeworks,
  listSubmissions,
  submitFeedback,
  archiveHomework,
  type HomeworkWithSubmissionCount,
  type SubmissionWithUser,
} from '@/lib/api/homework'
import type { HomeworkQuestion } from '@/lib/types'
import { useAuthStore } from '@/lib/store/authStore'

type ExpandedSubmission = {
  homeworkId: string
  submissionId: string
}

export function HomeworkSubmissions({ courseId }: { courseId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const hasLoaded = useRef(false)

  const [homeworks, setHomeworks] = useState<HomeworkWithSubmissionCount[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [submissions, setSubmissions] = useState<Record<string, SubmissionWithUser[]>>({})
  const [expandedHw, setExpandedHw] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ExpandedSubmission | null>(null)
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<string | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (includeArchived: boolean) => {
    setLoading(true)
    try {
      const hws = await listCourseHomeworks(courseId, includeArchived)
      setHomeworks(hws)
    } catch {
      setError('Failed to load homeworks')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (!accessToken || hasLoaded.current) return
    hasLoaded.current = true
    load(false)
  }, [accessToken, load])

  async function toggleShowArchived() {
    const next = !showArchived
    setShowArchived(next)
    setExpandedHw(null)
    await load(next)
  }

  async function toggleHomework(hwId: string) {
    if (expandedHw === hwId) {
      setExpandedHw(null)
      return
    }
    setExpandedHw(hwId)
    if (!submissions[hwId]) {
      try {
        const subs = await listSubmissions(hwId)
        setSubmissions((prev) => ({ ...prev, [hwId]: (subs as SubmissionWithUser[]) ?? [] }))
      } catch {
        setSubmissions((prev) => ({ ...prev, [hwId]: [] }))
      }
    }
  }

  async function handleFeedback(submissionId: string) {
    const text = feedbackText[submissionId]?.trim()
    if (!text) return
    setSending(submissionId)
    try {
      await submitFeedback(submissionId, { feedback: text })
      setSuccessIds((prev) => new Set(prev).add(submissionId))
      setSubmissions((prev) => {
        const updated = { ...prev }
        for (const hwId of Object.keys(updated)) {
          updated[hwId] = updated[hwId].map((s) =>
            s.id === submissionId
              ? { ...s, feedback: text, feedbackAt: new Date() as unknown as Date }
              : s,
          )
        }
        return updated
      })
      qc.invalidateQueries({ queryKey: ['instructor', 'stats'] })
      qc.invalidateQueries({ queryKey: ['instructor', 'assignments'] })
      qc.invalidateQueries({ queryKey: ['instructor', 'pending-submissions'] })
    } catch {
      setError('Failed to send feedback')
    } finally {
      setSending(null)
    }
  }

  async function handleArchive(hwId: string) {
    setArchiving(hwId)
    try {
      await archiveHomework(hwId)
      if (!showArchived) {
        setHomeworks((prev) => prev.filter((h) => h.id !== hwId))
        if (expandedHw === hwId) setExpandedHw(null)
      } else {
        setHomeworks((prev) =>
          prev.map((h) => (h.id === hwId ? { ...h, archivedAt: new Date() as unknown as Date } : h)),
        )
      }
    } catch {
      setError('Failed to archive homework')
    } finally {
      setArchiving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4">
            <div className="h-4 w-48 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
  }

  const activeWithPending = homeworks.filter((h) => {
    if (h.archivedAt) return false
    // If submissions have been loaded for this hw, use live pending count
    const loaded = submissions[h.id]
    if (loaded) {
      return loaded.some((s) => !s.feedback && !successIds.has(s.id))
    }
    // Otherwise fall back to the server-supplied pending count
    return h.pendingSubmissionsCount > 0
  })
  const archivedHomeworks = homeworks.filter((h) => !!h.archivedAt)

  return (
    <div className="space-y-4">
      {/* Archived toggle */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="text-gray-400 gap-1.5" onClick={toggleShowArchived}>
          {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </div>

      {/* Active homeworks needing feedback */}
      {activeWithPending.length === 0 && !showArchived ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
          No pending submissions — all caught up!
        </div>
      ) : (
        <HomeworkList
          homeworks={activeWithPending}
          submissions={submissions}
          expandedHw={expandedHw}
          expanded={expanded}
          feedbackText={feedbackText}
          sending={sending}
          archiving={archiving}
          successIds={successIds}
          onToggle={toggleHomework}
          onExpand={setExpanded}
          onFeedbackChange={(id, text) => setFeedbackText((prev) => ({ ...prev, [id]: text }))}
          onSendFeedback={handleFeedback}
          onArchive={handleArchive}
          showArchiveButton
        />
      )}

      {/* Archived section */}
      {showArchived && archivedHomeworks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-1">
            Archived
          </p>
          <HomeworkList
            homeworks={archivedHomeworks}
            submissions={submissions}
            expandedHw={expandedHw}
            expanded={expanded}
            feedbackText={feedbackText}
            sending={sending}
            archiving={archiving}
            successIds={successIds}
            onToggle={toggleHomework}
            onExpand={setExpanded}
            onFeedbackChange={(id, text) => setFeedbackText((prev) => ({ ...prev, [id]: text }))}
            onSendFeedback={handleFeedback}
            onArchive={handleArchive}
            archived
          />
        </div>
      )}
    </div>
  )
}

type HomeworkListProps = {
  homeworks: HomeworkWithSubmissionCount[]
  submissions: Record<string, SubmissionWithUser[]>
  expandedHw: string | null
  expanded: { homeworkId: string; submissionId: string } | null
  feedbackText: Record<string, string>
  sending: string | null
  archiving: string | null
  successIds: Set<string>
  onToggle: (id: string) => void
  onExpand: (v: { homeworkId: string; submissionId: string } | null) => void
  onFeedbackChange: (submissionId: string, text: string) => void
  onSendFeedback: (submissionId: string) => void
  onArchive: (hwId: string) => void
  showArchiveButton?: boolean
  archived?: boolean
}

function HomeworkList({
  homeworks,
  submissions,
  expandedHw,
  expanded,
  feedbackText,
  sending,
  archiving,
  successIds,
  onToggle,
  onExpand,
  onFeedbackChange,
  onSendFeedback,
  onArchive,
  showArchiveButton,
  archived,
}: HomeworkListProps) {
  return (
    <div className="space-y-3">
      {homeworks.map((hw) => {
        const isOpen = expandedHw === hw.id
        const hwSubmissions = submissions[hw.id] ?? []
        const pendingCount = hwSubmissions.filter((s) => !s.feedback && !successIds.has(s.id)).length
        const totalCount = hw._count.submissions

        return (
          <div
            key={hw.id}
            className={cn(
              'rounded-xl border overflow-hidden',
              archived ? 'border-gray-100 opacity-60' : 'border-gray-100',
            )}
          >
            <div className="flex items-center">
              <button
                onClick={() => onToggle(hw.id)}
                className="flex flex-1 items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{hw.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{hw.lesson.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOpen && pendingCount > 0 && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                      {pendingCount} pending
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {totalCount} submission{totalCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {showArchiveButton && (
                <button
                  onClick={() => onArchive(hw.id)}
                  disabled={archiving === hw.id}
                  className="px-4 py-4 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                  title="Archive homework"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {hwSubmissions.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400 text-center">No submissions yet.</p>
                ) : (
                  hwSubmissions.map((sub) => {
                    const isExpanded =
                      expanded?.homeworkId === hw.id && expanded?.submissionId === sub.id
                    const hasFeedback = !!sub.feedback
                    const isSent = successIds.has(sub.id)

                    return (
                      <div key={sub.id} className="px-5 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() =>
                            onExpand(
                              isExpanded ? null : { homeworkId: hw.id, submissionId: sub.id },
                            )
                          }
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                            {sub.user.firstName[0]}
                            {sub.user.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {sub.user.firstName} {sub.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{sub.user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasFeedback || isSent ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Reviewed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <Clock className="h-3.5 w-3.5" />
                                Pending
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pl-10 space-y-4">
                            <div className="space-y-3">
                              {hw.questions.map((q: HomeworkQuestion, idx: number) => (
                                <div key={q.id}>
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    {idx + 1}. {q.text}
                                  </p>
                                  <p className="text-sm rounded-lg px-3 py-2 whitespace-pre-wrap bg-gray-50 text-gray-700">
                                    {(sub.answers as Record<string, string>)[q.id] ?? (
                                      <span className="text-gray-400 italic">No answer</span>
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {(hasFeedback || isSent) && (
                              <div className="rounded-lg border border-green-100 bg-green-50/50 px-3 py-2.5">
                                <p className="text-xs font-medium text-green-700 mb-1">Your feedback</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {sub.feedback ?? feedbackText[sub.id]}
                                </p>
                              </div>
                            )}

                            {!hasFeedback && !isSent && (
                              <div className="space-y-2">
                                <textarea
                                  className={cn(
                                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                                    'resize-y min-h-[80px] placeholder:text-gray-300',
                                  )}
                                  placeholder="Write feedback for this student…"
                                  value={feedbackText[sub.id] ?? ''}
                                  onChange={(e) => onFeedbackChange(sub.id, e.target.value)}
                                />
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    onClick={() => onSendFeedback(sub.id)}
                                    disabled={sending === sub.id || !feedbackText[sub.id]?.trim()}
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    {sending === sub.id ? 'Sending…' : 'Send Feedback'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Loader2, UploadCloud, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useJob } from '@/lib/hooks/useJob'
import {
  initiateVideoUpload,
  uploadToPresignedUrl,
  completeVideoUpload,
} from '@/lib/api/uploads'
import { DeleteBlockButton } from './DeleteBlockButton'

// ─── Types ─────────────────────────────────────────────────────────────────────

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'ready' | 'error'

// ─── Sub-components ────────────────────────────────────────────────────────────

function UploadState({
  onFile,
  progress,
  isUploading,
  error,
}: {
  onFile: (file: File) => void
  progress: number
  isUploading: boolean
  error: string | null
}) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0])
    },
    [onFile],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov'] },
    multiple: false,
    noClick: true,
    disabled: isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={[
        'my-2 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragActive
          ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
          : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40',
        isUploading ? 'opacity-75' : '',
      ].join(' ')}
    >
      <input {...getInputProps()} />

      <UploadCloud className="h-10 w-10 text-gray-400" />

      {isUploading ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Uploading… {progress}%
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDragActive ? 'Drop video here' : 'Drag & drop a video, or'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={open}
            disabled={isUploading}
          >
            Browse file
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            MP4, WebM, MOV — max 2 GB
          </p>
        </>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

function ProcessingState() {
  return (
    <div className="my-2 flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-900/40">
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Processing video…</span>
    </div>
  )
}

function ReadyState({ url, thumbnail }: { url: string; thumbnail?: string }) {
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <video
        src={url}
        poster={thumbnail}
        controls
        preload="metadata"
        className="aspect-video w-full bg-black"
      />
    </div>
  )
}

// ─── VideoBlock NodeView ────────────────────────────────────────────────────────

export function VideoBlock({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { uploadId, status, videoUrl, thumbnail } = node.attrs as {
    uploadId: string | null
    status: UploadPhase
    videoUrl: string | null
    thumbnail: string | null
  }

  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // jobId is stored transiently — it comes from the node attr so it survives re-renders
  const jobId: string | null = node.attrs.jobId ?? null

  const jobQuery = useJob(status === 'processing' ? jobId : null)

  // When the job completes, pull the final URL from the job API's resultUrl field.
  // The job API serialises result.resultUrl → top-level resultUrl in the response.
  if (
    status === 'processing' &&
    jobQuery.data?.status === 'completed'
  ) {
    const resultUrl = (jobQuery.data as unknown as { resultUrl?: string }).resultUrl
    updateAttributes({
      status: 'ready',
      videoUrl: resultUrl ?? videoUrl,
    })
  }

  if (
    status === 'processing' &&
    jobQuery.data?.status === 'failed'
  ) {
    updateAttributes({ status: 'error' })
  }

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      updateAttributes({ status: 'uploading' })

      try {
        // 1. Get presigned URL
        const { uploadId: id, presignedUrl } = await initiateVideoUpload(
          file.name,
          file.size,
          file.type,
        )
        updateAttributes({ uploadId: id })

        // 2. Upload directly to S3 via XHR so we get progress events
        await uploadToPresignedUrl(presignedUrl, file, setProgress)

        // 3. Tell the backend the upload is done → starts processing job
        const { jobId: jid } = await completeVideoUpload(id)
        updateAttributes({ status: 'processing', jobId: jid })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        updateAttributes({ status: 'idle' })
      }
    },
    [updateAttributes],
  )

  const phase: UploadPhase = status ?? 'idle'

  return (
    <NodeViewWrapper>
      <div className="group relative">
        {/* Delete button — appears on hover in the top-right corner */}
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <DeleteBlockButton label="video" onConfirm={deleteNode} />
        </div>

        {(phase === 'idle' || phase === 'uploading' || phase === 'error') && (
          <UploadState
            onFile={handleFile}
            progress={progress}
            isUploading={phase === 'uploading'}
            error={error}
          />
        )}
        {phase === 'processing' && <ProcessingState />}
        {phase === 'ready' && videoUrl && (
          <ReadyState url={videoUrl} thumbnail={thumbnail ?? undefined} />
        )}
        {phase === 'ready' && !videoUrl && <ProcessingState />}
      </div>
    </NodeViewWrapper>
  )
}

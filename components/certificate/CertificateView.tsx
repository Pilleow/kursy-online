'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Download, Share2, Check, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useJob } from '@/lib/hooks/useJob'
import { useCertificateUrls } from '@/lib/hooks/useProgress'

type Props = {
  certificateId: string
  jobId: string | null
  courseTitle: string
}

export function CertificateView({ certificateId, jobId: initialJobId, courseTitle }: Props) {
  const router = useRouter()
  const [jobId, setJobId] = useState(initialJobId)
  const [copied, setCopied] = useState(false)

  const { data: job } = useJob(jobId)

  const jobDone = !jobId || job?.status === 'completed' || job?.status === 'failed'

  useEffect(() => {
    if (jobId && (job?.status === 'completed' || job?.status === 'failed')) {
      setJobId(null)
      router.replace(`/certificates/${certificateId}`)
    }
  }, [job?.status, jobId, certificateId, router])

  const { data: urls, isLoading: urlsLoading, isError } = useCertificateUrls(certificateId, jobDone)

  const isGenerating = !jobDone || (jobDone && urlsLoading && !isError)

  function handleDownload() {
    if (urls?.downloadUrl) {
      window.location.href = urls.downloadUrl
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/certificates/${certificateId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback: select text from a temp input
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Generating your certificate…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Certificate of Completion</h1>
        <p className="text-sm text-gray-500">{courseTitle}</p>
      </div>

      {/* PDF preview */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-gray-50" style={{ aspectRatio: '1 / 1.414' }}>
        {urls?.viewUrl ? (
          <iframe
            src={urls.viewUrl}
            className="w-full h-full"
            title="Certificate preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <FileX className="h-10 w-10" />
            <p className="text-sm">Preview not available</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleShare}>
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Copy Link
            </>
          )}
        </Button>
        <Button size="sm" onClick={handleDownload} disabled={!urls?.downloadUrl}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download PDF
        </Button>
      </div>
    </div>
  )
}

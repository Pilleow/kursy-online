import { apiFetch } from './client'

type InitiateResponse = {
  uploadId: string
  presignedUrl: string
}

type CompleteResponse = {
  jobId: string
}

export function initiateVideoUpload(
  fileName: string,
  fileSize: number,
  mimeType: string,
): Promise<InitiateResponse> {
  return apiFetch('/api/v1/uploads/video/initiate', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileSize, mimeType }),
  })
}

export function completeVideoUpload(uploadId: string): Promise<CompleteResponse> {
  return apiFetch(`/api/v1/uploads/video/${uploadId}/complete`, {
    method: 'POST',
  })
}

export function uploadToPresignedUrl(
  presignedUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))

    // Presigned URL already carries S3 auth in its query params.
    // Do NOT add an Authorization header — S3/MinIO rejects requests
    // that present two auth mechanisms simultaneously.
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

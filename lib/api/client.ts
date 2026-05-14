import { useAuthStore } from '@/lib/store/authStore'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: { error: string; details?: unknown }
  ) {
    super(body.error)
    this.name = 'ApiError'
  }
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(path, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    // Stale or revoked token — clear the store and send the user back to login
    if (res.status === 401) {
      useAuthStore.getState().clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      }
    }
    throw new ApiError(res.status, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

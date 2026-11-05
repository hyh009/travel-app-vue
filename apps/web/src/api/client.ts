import type { ApiErrorBody, ErrorCode } from '@travel/shared'

export class ApiError extends Error {
  code: ErrorCode
  status: number
  details?: unknown

  constructor(code: ErrorCode, status: number, details?: unknown) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

const BASE_URL = '/api'

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (res.status === 204) {
    return undefined as T
  }
  const body = await res.json()
  if (!res.ok) {
    const { error } = body as ApiErrorBody
    throw new ApiError(error.code, res.status, error.details)
  }
  return body as T
}

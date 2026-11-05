import type { ErrorCode } from '@travel/shared'

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

export function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError'
}

// 斷線或 5xx 是暫時的,值得再試;4xx(例如 401)重試只會得到一樣的結果
export function isRetryableError(err: unknown) {
  return !(err instanceof ApiError) || err.status >= 500
}

export function isUnauthorized(err: unknown) {
  return err instanceof ApiError && err.status === 401
}

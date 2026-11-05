import type { ApiErrorBody } from '@travel/shared'
import { sleep } from '@/utils'
import { ApiError, isRetryableError, isUnauthorized } from './error'

const BASE_URL = '/api'
const REFRESH_PATH = '/auth/refresh'
const MAX_REFRESH_ATTEMPTS = 3
const RETRY_DELAY_MS = 300

let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

async function send<T>(path: string, init?: RequestInit) {
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

async function refreshWithRetry() {
  for (let attempt = 1; ; attempt++) {
    try {
      await send<void>(REFRESH_PATH, { method: 'POST' })
      return
    } catch (err) {
      if (!isRetryableError(err) || attempt >= MAX_REFRESH_ATTEMPTS) throw err
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }
}

// 同時多個請求遇到 401 時,共用同一次 refresh(refresh token 是一次性的)
let refreshing: Promise<void> | null = null

function refreshSession() {
  refreshing ??= refreshWithRetry().finally(() => {
    refreshing = null
  })
  return refreshing
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await send<T>(path, init)
  } catch (err) {
    const expired =
      err instanceof ApiError && err.code === 'INVALID_ACCESS_TOKEN' && path !== REFRESH_PATH
    if (!expired) throw err

    try {
      await refreshSession()
    } catch (refreshErr) {
      // 伺服器明確拒絕才算登入失效;只是斷線的話使用者可能仍是登入狀態
      if (isUnauthorized(refreshErr)) onSessionExpired?.()
      throw refreshErr
    }
    return send<T>(path, init)
  }
}

import type { Response } from 'express'
import { config } from './config.js'

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'
const REFRESH_PATH = '/api/auth'

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.isProd,
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export function setAuthCookies(res: Response, tokens: AuthTokens) {
  // The cookie outlives the JWT on purpose: an expired token still reaches the
  // server, so it can answer 401 and let the client refresh, instead of the
  // browser silently dropping it and the request looking like a guest's.
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieBase,
    maxAge: config.refreshTokenTtlMs,
  })
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieBase,
    path: REFRESH_PATH,
    maxAge: config.refreshTokenTtlMs,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieBase)
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase, path: REFRESH_PATH })
}

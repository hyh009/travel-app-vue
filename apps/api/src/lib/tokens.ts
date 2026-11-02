import { createHash, randomBytes } from 'node:crypto'
import type { Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { prisma } from './prisma.js'

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'
const REFRESH_PATH = '/api/auth'

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.isProd,
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function signAccessToken(userId: number) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(userId),
    expiresIn: config.accessTokenTtlSeconds,
  })
}

async function issueRefreshToken(userId: number) {
  const token = randomBytes(32).toString('base64url')
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + config.refreshTokenTtlMs),
    },
  })
  return token
}

export async function setAuthCookies(res: Response, userId: number) {
  const refreshToken = await issueRefreshToken(userId)

  res.cookie(ACCESS_COOKIE, signAccessToken(userId), {
    ...cookieBase,
    maxAge: config.accessTokenTtlSeconds * 1000,
  })
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieBase,
    path: REFRESH_PATH,
    maxAge: config.refreshTokenTtlMs,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieBase)
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase, path: REFRESH_PATH })
}

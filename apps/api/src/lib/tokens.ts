import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { prisma } from './prisma.js'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function signAccessToken(userId: number) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(userId),
    expiresIn: config.accessTokenTtlSeconds,
  })
}

export async function createRefreshToken(userId: number) {
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

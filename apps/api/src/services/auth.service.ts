import bcrypt from 'bcryptjs'
import { HttpError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import { createRefreshToken, hashToken, signAccessToken } from '../lib/tokens.js'
import type { LoginInput, RegisterInput } from '../schemas/auth.js'

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const

async function issueTokens(userId: number) {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: await createRefreshToken(userId),
  }
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new HttpError('EMAIL_TAKEN')
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
    select: publicUserSelect,
  })

  return { user, tokens: await issueTokens(user.id) }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError('INVALID_CREDENTIALS')
  }

  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    tokens: await issueTokens(user.id),
  }
}

export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new HttpError('NO_REFRESH_TOKEN')
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  })
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new HttpError('INVALID_REFRESH_TOKEN')
  }

  // Rotation: revoke the old token. `revokedAt: null` makes this atomic, so two
  // concurrent requests cannot both use the same token.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  if (count === 0) {
    throw new HttpError('INVALID_REFRESH_TOKEN')
  }

  return issueTokens(stored.userId)
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  })
  if (!user) {
    throw new HttpError('USER_NOT_FOUND')
  }
  return user
}

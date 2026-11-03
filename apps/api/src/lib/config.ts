import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: required('JWT_SECRET'),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6380',
}

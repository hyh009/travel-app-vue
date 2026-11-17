import type { RequestHandler } from 'express'
import { rateLimit, type RateLimitExceededEventHandler, type Store } from 'express-rate-limit'
import { RedisStore, type RedisReply } from 'rate-limit-redis'
import { redis } from '../lib/redis.js'
import { config } from '../lib/config.js'
import { HttpError } from '../lib/errors.js'

export function redisStore(prefix: string) {
  return new RedisStore({
    prefix,
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<RedisReply>,
  })
}

interface LimiterOptions {
  windowMs: number
  limit: number
  store?: Store
}

// 只有「超過限制」時,套件才會呼叫它。沒超過時,套件自己 next() 放行
const rejectTooManyRequests: RateLimitExceededEventHandler = (_req, _res, next) => {
  next(new HttpError('RATE_LIMITED'))
}

export function createLimiter({ windowMs, limit, store }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    handler: rejectTooManyRequests,
  })
}

const passThrough: RequestHandler = (_req, _res, next) => next()

// 測試環境不建立:CI 沒有 Redis(RedisStore 一建立就會連線),
// 而且其他測試會連續打 /login,會被限流擋住。限流本身用記憶體儲存另外測
export const apiLimiter = config.isTest
  ? passThrough
  : createLimiter({ windowMs: 60_000, limit: 300, store: redisStore('rl:api:') })

// 登入和註冊共用:防暴力破解、防大量註冊
export const authLimiter = config.isTest
  ? passThrough
  : createLimiter({ windowMs: 15 * 60_000, limit: 10, store: redisStore('rl:auth:') })

import { afterEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import type { Store } from 'express-rate-limit'
import { app as realApp } from '../app.js'
import { errorHandler } from './errorHandler.js'
import { createLimiter } from './rateLimit.js'

// 沒傳 store 就是記憶體儲存,不需要 Redis。每個測試各建一個 app,計數不會互相影響
function appWithLimit(limit: number, store?: Store) {
  const app = express()
  app.set('trust proxy', 1)
  app.use(createLimiter({ windowMs: 60_000, limit, store }))
  app.get('/', (_req, res) => {
    res.json({ ok: true })
  })
  app.use(errorHandler)
  return app
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createLimiter', () => {
  it('額度內放行,超過回 429 與統一的錯誤格式', async () => {
    const app = appWithLimit(3)

    for (let i = 0; i < 3; i++) await request(app).get('/').expect(200)
    const res = await request(app).get('/')

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('RATE_LIMITED')
  })

  it('回應帶 RateLimit 標頭,被擋時有 Retry-After', async () => {
    const app = appWithLimit(1)

    const ok = await request(app).get('/')
    expect(ok.headers['ratelimit-limit']).toBe('1')

    const blocked = await request(app).get('/')
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0)
  })

  it('不同來源 IP 分開計算(trust proxy:用 X-Forwarded-For 的 IP)', async () => {
    const app = appWithLimit(1)

    await request(app).get('/').set('X-Forwarded-For', '1.1.1.1').expect(200)
    await request(app).get('/').set('X-Forwarded-For', '1.1.1.1').expect(429)
    await request(app).get('/').set('X-Forwarded-For', '2.2.2.2').expect(200)
  })

  it('儲存(Redis)出錯時放行,不能讓整個網站跟著不能用', async () => {
    // 套件發現 store 出錯會記錄錯誤,這裡不要讓它噴在測試輸出裡
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const brokenStore: Store = {
      increment: () => Promise.reject(new Error('redis down')),
      decrement: () => Promise.resolve(),
      resetKey: () => Promise.resolve(),
    }

    await request(appWithLimit(1, brokenStore)).get('/').expect(200)
  })
})

describe('正式 app', () => {
  // 這個設定拿掉的話,Caddy 後面所有人的來源 IP 都會是 Caddy 的 IP,全站共用同一份額度
  it('有設定 trust proxy(一層:Caddy)', () => {
    expect(realApp.get('trust proxy')).toBe(1)
  })
})

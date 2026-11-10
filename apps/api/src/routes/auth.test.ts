import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { prisma } from '../lib/prisma.js'
import { credentials, resetDb } from '../test/helpers.js'

beforeEach(resetDb)

// agent 會像瀏覽器一樣保存 cookie
async function loggedInAgent() {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send(credentials).expect(201)
  return agent
}

describe('POST /api/auth/register', () => {
  it('註冊成功:回 201、不含密碼、設定兩個 httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(credentials.email)
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
    const cookies = (res.headers['set-cookie'] as unknown as string[]).join(';')
    expect(cookies).toContain('access_token=')
    expect(cookies).toContain('refresh_token=')
    expect(cookies).toContain('HttpOnly')
  })

  it('密碼存的是雜湊,不是明文', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const user = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } })
    expect(user.passwordHash).not.toBe(credentials.password)
  })

  it('Email 大小寫視為同一個,重複註冊回 409', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'A@Example.com' })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('密碼太短回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('POST /api/auth/login', () => {
  it('帳密正確:200', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const res = await request(app).post('/api/auth/login').send(credentials)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(credentials.email)
  })

  it('密碼錯誤與帳號不存在,回一樣的錯誤(不洩漏帳號是否存在)', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
    const noUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' })

    expect(wrongPassword.status).toBe(401)
    expect(noUser.status).toBe(401)
    expect(wrongPassword.body).toEqual(noUser.body)
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS')
  })
})

describe('GET /api/auth/me', () => {
  it('沒登入回 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('NOT_AUTHENTICATED')
  })

  it('登入後回自己的資料', async () => {
    const agent = await loggedInAgent()
    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(credentials.email)
  })

  it('壞掉的 access token 回 INVALID_ACCESS_TOKEN', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'access_token=garbage')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_ACCESS_TOKEN')
  })
})

describe('POST /api/auth/refresh(token 輪替)', () => {
  it('成功換到新 token,且之後仍是登入狀態', async () => {
    const agent = await loggedInAgent()
    await agent.post('/api/auth/refresh').expect(204)
    await agent.get('/api/auth/me').expect(200)
  })

  it('舊的 refresh token 用過一次就作廢,重複使用回 401', async () => {
    const agent = await loggedInAgent()
    // 取出目前的 refresh token,等一下拿舊的再用一次
    const oldToken = agent.jar.getCookie('refresh_token', {
      path: '/api/auth',
      domain: '127.0.0.1',
      script: false,
      secure: false,
    } as never)?.value
    expect(oldToken).toBeTruthy()

    await agent.post('/api/auth/refresh').expect(204)

    const replay = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldToken}`)
    expect(replay.status).toBe(401)
    expect(replay.body.error.code).toBe('INVALID_REFRESH_TOKEN')
  })

  it('同一個 token 同時用兩次,只有一次成功', async () => {
    const agent = await loggedInAgent()
    const token = agent.jar.getCookie('refresh_token', {
      path: '/api/auth',
      domain: '127.0.0.1',
      script: false,
      secure: false,
    } as never)?.value

    const results = await Promise.all(
      [1, 2].map(() =>
        request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${token}`),
      ),
    )
    expect(results.map((r) => r.status).sort()).toEqual([204, 401])
  })

  it('沒帶 refresh token 回 401', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('NO_REFRESH_TOKEN')
  })

  it('過期的 refresh token 回 401', async () => {
    const agent = await loggedInAgent()
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
    const res = await agent.post('/api/auth/refresh')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN')
  })
})

describe('POST /api/auth/logout', () => {
  it('登出後,原本的 refresh token 不能再用', async () => {
    const agent = await loggedInAgent()
    const token = agent.jar.getCookie('refresh_token', {
      path: '/api/auth',
      domain: '127.0.0.1',
      script: false,
      secure: false,
    } as never)?.value

    await agent.post('/api/auth/logout').expect(204)

    const res = await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${token}`)
    expect(res.status).toBe(401)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { credentials, resetDb } from '../test/helpers.js'

beforeEach(resetDb)

// 涵蓋 a1、a2,不含 far
const NEAR = 'swLat=23.4&swLng=120.7&neLat=23.9&neLng=121.0'

describe('GET /api/places', () => {
  it('只回範圍內的景點', async () => {
    const res = await request(app).get(`/api/places?${NEAR}`).expect(200)
    expect(res.body.places.map((p: { id: string }) => p.id)).toEqual(['a1', 'a2'])
    expect(res.body.total).toBe(2)
  })

  it('範圍超過 0.5 度回 400', async () => {
    const res = await request(app).get('/api/places?swLat=22&swLng=120&neLat=24&neLng=122')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
  })

  it('剛好 0.5 度可以', async () => {
    await request(app).get('/api/places?swLat=23.4&swLng=120.5&neLat=23.9&neLng=121.0').expect(200)
  })

  it.each([
    ['缺參數', 'swLat=23&swLng=120'],
    ['不是數字', 'swLat=abc&swLng=120&neLat=23.1&neLng=120.1'],
    ['東北角小於西南角', 'swLat=23.2&swLng=120.2&neLat=23.1&neLng=120.1'],
  ])('%s 回 400', async (_name, qs) => {
    await request(app).get(`/api/places?${qs}`).expect(400)
  })

  it('訪客的 isFavorite 全是 false;登入並收藏後該筆變 true', async () => {
    const guest = await request(app).get(`/api/places?${NEAR}`)
    expect(guest.body.places.every((p: { isFavorite: boolean }) => !p.isFavorite)).toBe(true)

    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(credentials).expect(201)
    await agent.put('/api/favorites/a1').expect(204)

    const res = await agent.get(`/api/places?${NEAR}`)
    const byId = Object.fromEntries(
      res.body.places.map((p: { id: string; isFavorite: boolean }) => [p.id, p.isFavorite]),
    )
    expect(byId).toEqual({ a1: true, a2: false })
  })

  it('帶了壞掉的 token 回 401,不會當成訪客', async () => {
    const res = await request(app).get(`/api/places?${NEAR}`).set('Cookie', 'access_token=garbage')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/places/:id', () => {
  it('回單一景點', async () => {
    const res = await request(app).get('/api/places/a1').expect(200)
    expect(res.body.place).toMatchObject({ id: 'a1', name: '阿里山' })
  })

  it('不存在回 404', async () => {
    const res = await request(app).get('/api/places/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PLACE_NOT_FOUND')
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { credentials, resetDb } from '../test/helpers.js'

beforeEach(resetDb)

async function loggedInAgent(email = credentials.email) {
  const agent = request.agent(app)
  await agent
    .post('/api/auth/register')
    .send({ ...credentials, email })
    .expect(201)
  return agent
}

describe('/api/favorites', () => {
  it('沒登入一律 401', async () => {
    await request(app).get('/api/favorites').expect(401)
    await request(app).put('/api/favorites/a1').expect(401)
    await request(app).delete('/api/favorites/a1').expect(401)
  })

  it('收藏後出現在列表,isFavorite 為 true', async () => {
    const agent = await loggedInAgent()
    await agent.put('/api/favorites/a1').expect(204)

    const res = await agent.get('/api/favorites').expect(200)
    expect(res.body.total).toBe(1)
    expect(res.body.places[0]).toMatchObject({ id: 'a1', isFavorite: true })
  })

  it('重複收藏是冪等的:一樣 204,不會多一筆', async () => {
    const agent = await loggedInAgent()
    await agent.put('/api/favorites/a1').expect(204)
    await agent.put('/api/favorites/a1').expect(204)

    const res = await agent.get('/api/favorites')
    expect(res.body.total).toBe(1)
  })

  it('取消收藏也是冪等的:沒收藏過也回 204', async () => {
    const agent = await loggedInAgent()
    await agent.put('/api/favorites/a1').expect(204)
    await agent.delete('/api/favorites/a1').expect(204)
    await agent.delete('/api/favorites/a1').expect(204)

    const res = await agent.get('/api/favorites')
    expect(res.body.total).toBe(0)
  })

  it('收藏不存在的景點回 404', async () => {
    const agent = await loggedInAgent()
    const res = await agent.put('/api/favorites/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PLACE_NOT_FOUND')
  })

  it('每個人的收藏互不影響', async () => {
    const alice = await loggedInAgent('alice@example.com')
    const bob = await loggedInAgent('bob@example.com')
    await alice.put('/api/favorites/a1').expect(204)

    expect((await bob.get('/api/favorites')).body.total).toBe(0)
  })

  it('分頁:pageSize 切開,total 是全部數量', async () => {
    const agent = await loggedInAgent()
    await agent.put('/api/favorites/a1').expect(204)
    await agent.put('/api/favorites/a2').expect(204)

    const page1 = await agent.get('/api/favorites?page=1&pageSize=1')
    const page2 = await agent.get('/api/favorites?page=2&pageSize=1')
    expect(page1.body.places).toHaveLength(1)
    expect(page2.body.places).toHaveLength(1)
    expect(page1.body.total).toBe(2)
    expect(page1.body.places[0].id).not.toBe(page2.body.places[0].id)
  })
})

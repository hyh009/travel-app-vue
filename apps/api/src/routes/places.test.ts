import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { prisma } from '../lib/prisma.js'
import { credentials, resetDb, seedTaiwan } from '../test/helpers.js'

beforeEach(resetDb)

const ids = (res: { body: { places: { id: string }[] } }) => res.body.places.map((p) => p.id)

// 涵蓋 a1、a2,不含 far
const NEAR = 'swLat=23.4&swLng=120.7&neLat=23.9&neLng=121.0'
// 涵蓋臺北市與基隆市,不含花蓮
const TAIPEI_KEELUNG = 'swLat=24.9&swLng=121.4&neLat=25.3&neLng=121.8'

describe('GET /api/places', () => {
  it('只回範圍內的景點', async () => {
    const res = await request(app).get(`/api/places?${NEAR}`).expect(200)
    expect(ids(res)).toEqual(['a1', 'a2'])
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

  it('只給 city:只回該縣市的景點', async () => {
    await seedTaiwan()
    const res = await request(app)
      .get(`/api/places?${TAIPEI_KEELUNG}&city=${encodeURIComponent('臺北市')}`)
      .expect(200)
    expect(ids(res)).toEqual(['t1', 't2', 't3'])
    expect(res.body.total).toBe(3)
  })

  it('只給 town 沒給 city:回 400', async () => {
    const res = await request(app).get(
      `/api/places?${TAIPEI_KEELUNG}&town=${encodeURIComponent('中正區')}`,
    )
    expect(res.status).toBe(400)
  })

  it('city 加 town:只回該鄉鎮(同名的中正區不混)', async () => {
    await seedTaiwan()
    const res = await request(app).get(
      `/api/places?${TAIPEI_KEELUNG}&city=${encodeURIComponent('臺北市')}&town=${encodeURIComponent('中正區')}`,
    )
    expect(ids(res)).toEqual(['t2'])
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

describe('GET /api/places/search', () => {
  it('用名稱搜尋', async () => {
    const res = await request(app)
      .get(`/api/places/search?q=${encodeURIComponent('日月')}`)
      .expect(200)
    expect(ids(res)).toEqual(['a2'])
  })

  it('用縣市或鄉鎮搜尋(測試資料全部是「測試市」)', async () => {
    const byCity = await request(app).get(`/api/places/search?q=${encodeURIComponent('測試市')}`)
    const byTown = await request(app).get(`/api/places/search?q=${encodeURIComponent('測試區')}`)
    expect(ids(byCity)).toHaveLength(3)
    expect(ids(byTown)).toHaveLength(3)
  })

  it('名稱符合的排在只有縣市符合的前面', async () => {
    await prisma.attraction.create({
      data: {
        id: 'z',
        name: '某處',
        description: '',
        city: '阿里山市',
        town: 'x',
        lat: 23,
        lng: 120,
        isFree: true,
      },
    })
    const res = await request(app).get(`/api/places/search?q=${encodeURIComponent('阿里山')}`)
    expect(ids(res)).toEqual(['a1', 'z'])
  })

  it('英文不分大小寫', async () => {
    await prisma.attraction.create({
      data: {
        id: 'e',
        name: 'Sun Moon Lake',
        description: '',
        city: 'x',
        town: 'x',
        lat: 23,
        lng: 120,
        isFree: true,
      },
    })
    const res = await request(app).get('/api/places/search?q=sun%20MOON')
    expect(ids(res)).toEqual(['e'])
  })

  it('最多回 20 筆', async () => {
    await prisma.attraction.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        id: `m${i}`,
        name: `夜市${i}`,
        description: '',
        city: 'x',
        town: 'x',
        lat: 23,
        lng: 120,
        isFree: true,
      })),
    })
    const res = await request(app).get(`/api/places/search?q=${encodeURIComponent('夜市')}`)
    expect(res.body.places).toHaveLength(20)
  })

  it('沒有符合的回空陣列', async () => {
    const res = await request(app).get('/api/places/search?q=zzzzzz').expect(200)
    expect(res.body.places).toEqual([])
  })

  it('關鍵字 % 與 _ 只當一般字元,不會變成萬用字元', async () => {
    const res = await request(app).get('/api/places/search?q=%25').expect(200)
    expect(res.body.places).toEqual([])
  })

  it.each([
    ['沒有 q', ''],
    ['空白', '?q=%20%20'],
    ['超過 50 字', `?q=${'a'.repeat(51)}`],
  ])('%s 回 400', async (_n, qs) => {
    await request(app).get(`/api/places/search${qs}`).expect(400)
  })

  it('登入後 isFavorite 正確', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(credentials).expect(201)
    await agent.put('/api/favorites/a1').expect(204)
    const res = await agent.get(`/api/places/search?q=${encodeURIComponent('阿里山')}`)
    expect(res.body.places[0]).toMatchObject({ id: 'a1', isFavorite: true })
  })
})

describe('GET /api/places/search:台/臺與多關鍵字', () => {
  const search = (q: string) =>
    request(app)
      .get(`/api/places/search?q=${encodeURIComponent(q)}`)
      .expect(200)

  it('打「台北」找得到資料裡的「臺北市」', async () => {
    await seedTaiwan()
    const res = await search('台北')
    expect(ids(res).sort()).toEqual(['t1', 't2', 't3'])
  })

  it('多個關鍵字要全部符合', async () => {
    await seedTaiwan()
    const res = await search('臺北 故宮')
    expect(ids(res)).toEqual(['t1'])
  })

  it('搜縣市:回一個縣市地區,數量與外框正確,不夾帶該縣市的鄉鎮', async () => {
    await seedTaiwan()
    const { areas } = (await search('台北市')).body
    expect(areas).toEqual([
      {
        city: '臺北市',
        town: null,
        count: 3,
        bounds: { swLat: 25.03, swLng: 121.5, neLat: 25.1, neLng: 121.56 },
      },
    ])
  })

  it('搜鄉鎮:同名鄉鎮(中正區)要連縣市一起回,分開成兩個地區', async () => {
    await seedTaiwan()
    const { areas } = (await search('中正區')).body
    expect(areas.map((a: { city: string; town: string }) => `${a.city}${a.town}`).sort()).toEqual([
      '基隆市中正區',
      '臺北市中正區',
    ])
  })

  it('縣市加鄉鎮:只回對應的那個鄉鎮', async () => {
    await seedTaiwan()
    const { areas } = (await search('台北 中正')).body
    expect(areas).toHaveLength(1)
    expect(areas[0]).toMatchObject({ city: '臺北市', town: '中正區', count: 1 })
  })

  it('搜景點名稱:沒有地區,只有景點', async () => {
    await seedTaiwan()
    const res = await search('太魯閣')
    expect(res.body.areas).toEqual([])
    expect(res.body.places).toHaveLength(1)
  })

  it('縣市地區排在鄉鎮地區前面', async () => {
    await prisma.attraction.create({
      data: {
        id: 'x',
        name: 'x',
        description: '',
        city: '新北市',
        town: '新北區',
        lat: 25,
        lng: 121,
        isFree: true,
      },
    })
    const { areas } = (await search('新北')).body
    expect(areas.map((a: { town: string | null }) => a.town)).toEqual([null, '新北區'])
  })
})

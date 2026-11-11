import { prisma } from '../lib/prisma.js'

export const PLACES = [
  { id: 'a1', name: '阿里山', lat: 23.5, lng: 120.8 },
  { id: 'a2', name: '日月潭', lat: 23.85, lng: 120.9 },
  { id: 'far', name: '墾丁', lat: 22.0, lng: 120.8 },
]

// 每個測試前:清掉使用者(連帶刪除 token 與收藏),重建景點資料
export async function resetDb() {
  await prisma.user.deleteMany()
  await prisma.attraction.deleteMany()
  await prisma.attraction.createMany({
    data: PLACES.map((p) => ({
      ...p,
      description: '',
      city: '測試市',
      town: '測試區',
      isFree: true,
    })),
  })
}

// 多個縣市的測試資料;注意「中正區」同時在臺北市與基隆市
export async function seedTaiwan() {
  const base = { description: '', isFree: true }
  await prisma.attraction.createMany({
    data: [
      { ...base, id: 't1', name: '故宮', city: '臺北市', town: '士林區', lat: 25.1, lng: 121.5 },
      {
        ...base,
        id: 't2',
        name: '中正紀念堂',
        city: '臺北市',
        town: '中正區',
        lat: 25.04,
        lng: 121.52,
      },
      {
        ...base,
        id: 't3',
        name: '台北101',
        city: '臺北市',
        town: '信義區',
        lat: 25.03,
        lng: 121.56,
      },
      {
        ...base,
        id: 'k1',
        name: '廟口',
        city: '基隆市',
        town: '中正區',
        lat: 25.13,
        lng: 121.74,
      },
      {
        ...base,
        id: 'h1',
        name: '太魯閣',
        city: '花蓮縣',
        town: '秀林鄉',
        lat: 24.15,
        lng: 121.6,
      },
    ],
  })
}

export const credentials = { email: 'a@example.com', password: 'password123' }

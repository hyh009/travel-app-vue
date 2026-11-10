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

export const credentials = { email: 'a@example.com', password: 'password123' }

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/api/client'
import { fetchPlaces } from './places.service'

vi.mock('@/api/client', () => ({ request: vi.fn() }))

const viewport = { swLat: 25, swLng: 121, neLat: 25.1, neLng: 121.1 }

// 取出最後一次 request 的網址參數
function lastParams() {
  const url = vi.mocked(request).mock.calls.at(-1)![0] as string
  return new URL(url, 'http://x').searchParams
}

describe('fetchPlaces', () => {
  beforeEach(() => vi.resetAllMocks())

  it('沒給 city、town 時不送出這兩個參數(不能變成字串 "undefined")', async () => {
    await fetchPlaces({ ...viewport, city: undefined, town: undefined })
    const params = lastParams()
    expect(params.has('city')).toBe(false)
    expect(params.has('town')).toBe(false)
    expect(params.get('swLat')).toBe('25')
  })

  it('有給 city、town 時一併送出', async () => {
    await fetchPlaces({ ...viewport, city: '臺北市', town: '中正區' })
    const params = lastParams()
    expect(params.get('city')).toBe('臺北市')
    expect(params.get('town')).toBe('中正區')
  })
})

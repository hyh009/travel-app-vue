import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { PlacesQuery, PlacesResponse } from '@travel/shared'
import { fetchPlaces } from '@/services/places.service'
import { usePlaces } from './usePlaces'

vi.mock('@/services/places.service', () => ({ fetchPlaces: vi.fn() }))

const query = { minLat: 23, maxLat: 23.2, minLng: 121, maxLng: 121.2 } as unknown as PlacesQuery

function response(favorites: Record<string, boolean>): PlacesResponse {
  return {
    total: Object.keys(favorites).length,
    places: Object.entries(favorites).map(([id, isFavorite]) => ({ id, name: id, isFavorite })),
  } as unknown as PlacesResponse
}

// 讓 watch 的 callback 與其中的 await 都跑完
const settle = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

describe('usePlaces', () => {
  beforeEach(() => vi.resetAllMocks())

  it('bounds 是 null 時不發 request', async () => {
    usePlaces(ref(null), () => undefined)
    await settle()
    expect(fetchPlaces).not.toHaveBeenCalled()
  })

  it('有 bounds 就載入資料,結束後 loading 回 false', async () => {
    vi.mocked(fetchPlaces).mockResolvedValue(response({ a: false }))
    const { data, loading } = usePlaces(ref(query), () => undefined)
    expect(loading.value).toBe(true) // immediate:建立當下就開始載入
    await settle()
    expect(loading.value).toBe(false)
    expect(data.value?.places).toHaveLength(1)
  })

  it('request 失敗會把錯誤存進 error', async () => {
    vi.mocked(fetchPlaces).mockRejectedValue(new Error('boom'))
    const { error, loading } = usePlaces(ref(query), () => undefined)
    await settle()
    expect(error.value?.message).toBe('boom')
    expect(loading.value).toBe(false)
  })

  it('identity 改變(例如登出入)會重新查詢', async () => {
    vi.mocked(fetchPlaces).mockResolvedValue(response({ a: false }))
    const userId = ref<string | undefined>(undefined)
    usePlaces(ref(query), () => userId.value)
    await settle()
    userId.value = 'u1'
    await settle()
    expect(fetchPlaces).toHaveBeenCalledTimes(2)
  })

  it('bounds 變了,上一個 request 的 signal 會被 abort', async () => {
    vi.mocked(fetchPlaces).mockImplementation(() => new Promise(() => {}))
    const bounds = ref<PlacesQuery | null>(query)
    usePlaces(bounds, () => undefined)
    await nextTick()
    const firstSignal = vi.mocked(fetchPlaces).mock.calls[0]![1] as AbortSignal
    bounds.value = { ...query, minLat: 22 } as PlacesQuery
    await nextTick()
    expect(firstSignal.aborted).toBe(true)
  })

  it('setFavorite 只改指定那一筆,並換成新的物件', async () => {
    vi.mocked(fetchPlaces).mockResolvedValue(response({ a: false, b: false }))
    const { data, setFavorite } = usePlaces(ref(query), () => undefined)
    await settle()
    const before = data.value

    setFavorite('a', true)

    expect(data.value).not.toBe(before)
    expect(data.value?.places.map((p) => p.isFavorite)).toEqual([true, false])
    expect(before?.places[0]?.isFavorite).toBe(false)
  })

  it('還沒有資料時 setFavorite 不會出錯', () => {
    const { data, setFavorite } = usePlaces(ref(null), () => undefined)
    expect(() => setFavorite('a', true)).not.toThrow()
    expect(data.value).toBeNull()
  })
})

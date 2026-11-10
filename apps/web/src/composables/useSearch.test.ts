import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { searchPlaces } from '@/services/places.service'
import { useSearch } from './useSearch'

vi.mock('@/services/places.service', () => ({ searchPlaces: vi.fn() }))

const found = { areas: [], places: [{ id: 'a' }] } as never

// 推進假的時間,並讓 watch callback 有機會執行
async function advance(ms: number) {
  await nextTick()
  await vi.advanceTimersByTimeAsync(ms)
}

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetAllMocks()
    vi.mocked(searchPlaces).mockResolvedValue(found)
  })
  afterEach(() => vi.useRealTimers())

  it('連續打字只會在停下 300ms 後查一次,用最後的內容', async () => {
    const { query } = useSearch()
    query.value = 'a'
    await advance(100)
    query.value = 'ab'
    await advance(100)
    query.value = 'abc'
    await advance(299)
    expect(searchPlaces).not.toHaveBeenCalled()

    await advance(1)
    expect(searchPlaces).toHaveBeenCalledTimes(1)
    expect(vi.mocked(searchPlaces).mock.calls[0]![0]).toBe('abc')
  })

  it('查詢成功後,結果存進 results,loading 回 false', async () => {
    const { query, results, loading } = useSearch()
    query.value = 'abc'
    await advance(300)
    expect(results.value).toEqual(found)
    expect(loading.value).toBe(false)
  })

  it('清空輸入(或只有空白)不發請求,並清掉舊結果', async () => {
    const { query, results } = useSearch()
    query.value = 'abc'
    await advance(300)
    expect(results.value.places).toHaveLength(1)

    query.value = '   '
    await advance(300)
    expect(searchPlaces).toHaveBeenCalledTimes(1)
    expect(results.value).toEqual({ areas: [], places: [] })
  })

  it('請求進行到一半就把輸入清空,loading 不會卡在 true', async () => {
    vi.mocked(searchPlaces).mockImplementation(() => new Promise(() => {}))
    const { query, loading } = useSearch()
    query.value = 'abc'
    await advance(300)
    expect(loading.value).toBe(true)

    query.value = ''
    await advance(300)
    expect(loading.value).toBe(false)
  })

  it('新的輸入會把進行中的上一個請求 abort', async () => {
    vi.mocked(searchPlaces).mockImplementation(() => new Promise(() => {}))
    const { query } = useSearch()
    query.value = 'abc'
    await advance(300)
    const firstSignal = vi.mocked(searchPlaces).mock.calls[0]![1] as AbortSignal

    query.value = 'abcd'
    await advance(0)
    expect(firstSignal.aborted).toBe(true)
  })

  it('請求失敗存進 error', async () => {
    vi.mocked(searchPlaces).mockRejectedValue(new Error('boom'))
    const { query, error, loading } = useSearch()
    query.value = 'abc'
    await advance(300)
    expect(error.value?.message).toBe('boom')
    expect(loading.value).toBe(false)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/error'
import { addFavorite, removeFavorite } from '@/services/favorite.service'
import { useToast } from '@/composables/useToast'
import { useFavoriteMutation } from './useFavoriteMutation'

vi.mock('@/services/favorite.service', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))

describe('useFavoriteMutation', () => {
  const apply = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    useToast().state.value.show = false
  })

  it('成功:先樂觀更新,只更新一次,回傳 true', async () => {
    vi.mocked(addFavorite).mockResolvedValue(undefined as never)
    const { changeFavorite } = useFavoriteMutation(apply)

    const ok = await changeFavorite('p1', true, '阿里山')

    expect(ok).toBe(true)
    expect(addFavorite).toHaveBeenCalledWith('p1')
    expect(apply).toHaveBeenCalledTimes(1)
    expect(apply).toHaveBeenCalledWith('p1', true)
  })

  it('取消收藏會呼叫 removeFavorite', async () => {
    vi.mocked(removeFavorite).mockResolvedValue(undefined as never)
    const { changeFavorite } = useFavoriteMutation(apply)

    await changeFavorite('p1', false)

    expect(removeFavorite).toHaveBeenCalledWith('p1')
    expect(addFavorite).not.toHaveBeenCalled()
  })

  it('失敗:還原成原本的值、跳錯誤提示、回傳 false', async () => {
    vi.mocked(addFavorite).mockRejectedValue(new ApiError('INTERNAL_ERROR', 500))
    const { changeFavorite } = useFavoriteMutation(apply)

    const ok = await changeFavorite('p1', true, '阿里山')

    expect(ok).toBe(false)
    expect(apply).toHaveBeenNthCalledWith(1, 'p1', true)
    expect(apply).toHaveBeenNthCalledWith(2, 'p1', false)
    const toast = useToast().state.value
    expect(toast.show).toBe(true)
    expect(toast.type).toBe('error')
    expect(toast.message).toContain('阿里山')
    expect(toast.message).toContain('收藏失敗')
  })

  it('toggleFavorite 依目前狀態反轉', async () => {
    vi.mocked(removeFavorite).mockResolvedValue(undefined as never)
    const { toggleFavorite } = useFavoriteMutation(apply)

    await toggleFavorite({ id: 'p1', name: '阿里山', isFavorite: true })

    expect(apply).toHaveBeenCalledWith('p1', false)
    expect(removeFavorite).toHaveBeenCalledWith('p1')
  })
})

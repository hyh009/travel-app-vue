import type { PlaceSummary } from '@travel/shared'
import { addFavorite, removeFavorite } from '@/services/favorite.service'
import { useToast } from '@/composables/useToast'
import { errorMessage } from '@/utils/errorMessages'

// apply:把某個景點的收藏狀態寫進「這個畫面自己的資料」(列表頁與收藏頁的資料來源不同,所以由呼叫端傳入)
export function useFavoriteToggle(apply: (id: string, isFavorite: boolean) => void) {
  const toast = useToast()

  async function toggleFavorite(place: Pick<PlaceSummary, 'id' | 'name' | 'isFavorite'>) {
    const { id, name, isFavorite: current } = place
    const next = !current

    // 1. 樂觀更新
    apply(id, next)

    try {
      // 2. request
      await (next ? addFavorite(id) : removeFavorite(id))
    } catch (err) {
      // 3. 失敗:只把這一筆設回原本的值,並告訴使用者
      apply(id, current)
      toast.show(`「${name}」${next ? '收藏' : '取消收藏'}失敗:${errorMessage(err)}`, 'error')
    }
  }

  return { toggleFavorite }
}

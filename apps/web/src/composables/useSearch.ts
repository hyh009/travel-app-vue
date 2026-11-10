import { ref, watch, onWatcherCleanup } from 'vue'
import type { SearchResponse } from '@travel/shared'
import { searchPlaces } from '@/services/places.service'
import { isAbortError } from '@/api/error'
import { sleep } from '@/utils'

const EMPTY: SearchResponse = { areas: [], places: [] }

export function useSearch() {
  const query = ref('')
  const results = ref<SearchResponse>(EMPTY)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  watch(query, async (value) => {
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())

    await sleep(300)
    if (controller.signal.aborted) return

    // 只有空白也算沒輸入:清掉舊結果,不發請求
    const q = value.trim()
    if (!q) {
      results.value = EMPTY
      error.value = null
      loading.value = false
      return
    }

    loading.value = true
    error.value = null
    try {
      results.value = await searchPlaces(q, controller.signal)
    } catch (err) {
      if (isAbortError(err)) return
      error.value = err instanceof Error ? err : new Error(String(err))
    }
    loading.value = false
  })
  return { query, results, loading, error }
}

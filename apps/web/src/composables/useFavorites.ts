import { ref, shallowRef, computed, watch, onWatcherCleanup } from 'vue'
import type { FavoritesResponse } from '@travel/shared'
import { fetchFavorites } from '@/services/favorite.service'
import { isAbortError } from '@/api/error'

export function useFavorites() {
  const page = ref<number>(1)
  const data = shallowRef<FavoritesResponse | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const PAGE_SIZE = 12

  function setFavorite(id: string, isFavorite: boolean) {
    if (!data.value) return
    data.value = {
      ...data.value,
      places: data.value.places.map((p) => (p.id === id ? { ...p, isFavorite } : p)),
    }
  }

  const totalPages = computed(() =>
    data.value ? Math.ceil(data.value.total / data.value.pageSize) : 0,
  )

  watch(
    page,
    async (value) => {
      const controller = new AbortController()
      onWatcherCleanup(() => controller.abort())
      loading.value = true
      error.value = null
      try {
        data.value = await fetchFavorites(
          {
            page: value,
            pageSize: PAGE_SIZE,
          },
          controller.signal,
        )
      } catch (err) {
        if (isAbortError(err)) return
        error.value = err instanceof Error ? err : new Error(String(err))
      }
      loading.value = false
    },
    { immediate: true },
  )

  return { data, loading, error, page, setFavorite, totalPages }
}

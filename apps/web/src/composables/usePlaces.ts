import { onWatcherCleanup, ref, shallowRef, watch, type WatchSource } from 'vue'
import type { PlacesQuery, PlacesResponse } from '@travel/shared'
import { fetchPlaces } from '@/services/places.service'
import { isAbortError } from '@/api/error'

export function usePlaces(query: WatchSource<PlacesQuery | null>, identity: WatchSource) {
  const data = shallowRef<PlacesResponse | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  function setFavorite(id: string, isFavorite: boolean) {
    if (!data.value) return
    data.value = {
      ...data.value,
      places: data.value.places.map((p) => (p.id === id ? { ...p, isFavorite } : p)),
    }
  }

  watch(
    [query, identity],
    async ([q]) => {
      if (!q) return

      const controller = new AbortController()
      onWatcherCleanup(() => controller.abort())

      loading.value = true
      error.value = null

      try {
        data.value = await fetchPlaces(q, controller.signal)
      } catch (err) {
        if (isAbortError(err)) return
        error.value = err instanceof Error ? err : new Error(String(err))
      }
      loading.value = false
    },
    { immediate: true },
  )
  return { data, loading, error, setFavorite }
}

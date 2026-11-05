import type { PlacesQuery, PlacesResponse } from '@travel/shared'
import { request } from '@/api/client'

export function fetchPlaces(bounds: PlacesQuery, signal?: AbortSignal) {
  const query = new URLSearchParams(
    Object.entries(bounds).map(([key, value]) => [key, String(value)]),
  )
  return request<PlacesResponse>(`/places?${query}`, { signal })
}

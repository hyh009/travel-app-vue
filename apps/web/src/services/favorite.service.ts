import type { FavoritesQuery, FavoritesResponse } from '@travel/shared'
import { request } from '@/api/client'

export function fetchFavorites(query: FavoritesQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  })
  return request<FavoritesResponse>(`/favorites?${params}`, { signal })
}

export function addFavorite(attractionId: string) {
  return request<void>(`/favorites/${encodeURIComponent(attractionId)}`, { method: 'PUT' })
}

export function removeFavorite(attractionId: string) {
  return request<void>(`/favorites/${encodeURIComponent(attractionId)}`, { method: 'DELETE' })
}

import { z } from 'zod'
import type { PlaceSummary } from './places.js'

const positiveInt = (max: number) =>
  z
    .string()
    .regex(/^\d+$/, 'Must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().min(1).max(max))

export const favoritesQuerySchema = z.object({
  page: positiveInt(100_000).default(1),
  pageSize: positiveInt(50).default(20),
})

export type FavoritesQuery = z.output<typeof favoritesQuerySchema>

export interface FavoritesResponse {
  // 每一筆的 isFavorite 一定是 true
  places: PlaceSummary[]
  total: number
  page: number
  pageSize: number
}

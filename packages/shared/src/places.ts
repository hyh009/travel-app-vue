import { z } from 'zod'

const MAX_SPAN_DEGREES = 0.5

const DECIMAL = /^-?\d+(\.\d+)?$/

const coord = (limit: number) =>
  z
    .string()
    .regex(DECIMAL, 'Must be a decimal number')
    .transform(Number)
    .pipe(z.number().min(-limit).max(limit))

export const placesQuerySchema = z
  .object({
    swLat: coord(90),
    swLng: coord(180),
    neLat: coord(90),
    neLng: coord(180),
  })
  .refine((q) => q.neLat > q.swLat && q.neLng > q.swLng, {
    message: 'Northeast corner must be greater than southwest corner',
  })
  .refine((q) => q.neLat - q.swLat <= MAX_SPAN_DEGREES && q.neLng - q.swLng <= MAX_SPAN_DEGREES, {
    message: 'Bounds too large',
  })

export type PlacesQuery = z.output<typeof placesQuerySchema>

export interface PlaceSummary {
  id: string
  name: string
  city: string
  town: string
  lat: number
  lng: number
  isFree: boolean
}

export interface PlaceDetail extends PlaceSummary {
  description: string
  website: string | null
}

export interface PlacesResponse {
  places: PlaceSummary[]
  // 範圍內符合的總數;大於 places.length 代表被截斷
  total: number
}

export interface PlaceDetailResponse {
  place: PlaceDetail
}

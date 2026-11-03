import { z } from 'zod'

export const PLACE_TYPES = ['restaurant', 'hotel', 'attraction'] as const
export type PlaceType = (typeof PLACE_TYPES)[number]

const MAX_SPAN_DEGREES = 0.1

const DECIMAL = /^-?\d+(\.\d+)?$/

const coord = (limit: number) =>
  z
    .string()
    .regex(DECIMAL, 'Must be a decimal number')
    .transform(Number)
    .pipe(z.number().min(-limit).max(limit))

export const placesQuerySchema = z
  .object({
    type: z.enum(PLACE_TYPES),
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

export interface Place {
  id: string
  type: PlaceType
  name: string
  rating: number | null
  reviewCount: number | null
  tags: string[]
  photoUrl: string | null
  lat: number
  lng: number
  url: string
}

export interface PlacesResponse {
  places: Place[]
}

import { z } from 'zod'

export const MAX_SPAN_DEGREES = 0.5

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
    city: z.string().trim().min(1).max(20).optional(),
    town: z.string().trim().min(1).max(20).optional(),
  })
  .refine((q) => q.town === undefined || q.city !== undefined, {
    message: 'town requires city',
  })
  .refine((q) => q.neLat > q.swLat && q.neLng > q.swLng, {
    message: 'Northeast corner must be greater than southwest corner',
  })
  .refine((q) => q.neLat - q.swLat <= MAX_SPAN_DEGREES && q.neLng - q.swLng <= MAX_SPAN_DEGREES, {
    message: 'Bounds too large',
  })

export type PlacesQuery = z.output<typeof placesQuerySchema>

// 地圖的畫面範圍:只有四個座標,不含地區篩選
export type Viewport = Pick<PlacesQuery, 'swLat' | 'swLng' | 'neLat' | 'neLng'>

export const MAX_SEARCH_RESULTS = 20

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(50),
})

export type SearchQuery = z.output<typeof searchQuerySchema>

export interface PlaceSummary {
  id: string
  name: string
  city: string
  town: string
  lat: number
  lng: number
  // null = 沒有資料,不知道是否免費
  isFree: boolean | null
  // 訪客一律為 false
  isFavorite: boolean
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

export const MAX_SEARCH_AREAS = 5

// 搜尋到的「地區」:整個縣市(town 為 null)或某個鄉鎮。
// bounds 是該地區所有景點座標的最小外框,不是行政區邊界;大縣市的外框可能超過
// MAX_SPAN_DEGREES(0.5 度),前端地圖無法縮小到放得下,只能分塊瀏覽
export interface SearchArea {
  city: string
  town: string | null
  count: number
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number }
}

export interface SearchResponse {
  areas: SearchArea[]
  places: PlaceSummary[]
}

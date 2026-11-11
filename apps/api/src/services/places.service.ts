import { MAX_SEARCH_AREAS, MAX_SEARCH_RESULTS } from '@travel/shared'
import type {
  PlaceDetail,
  PlacesQuery,
  PlacesResponse,
  SearchArea,
  SearchResponse,
} from '@travel/shared'
import { escapeLike, includesTerm, splitTerms, variantsOf } from '../lib/searchTerms.js'
import { HttpError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

const MAX_PLACES = 500

// Guests have no userId; `userId: -1` can never match a real user's favorite.
const favoriteOf = (userId: number | undefined) => ({
  where: { userId: userId ?? -1 },
  select: { userId: true },
})

export async function listInBounds(
  query: PlacesQuery,
  userId: number | undefined,
): Promise<PlacesResponse> {
  const where = {
    lat: { gte: query.swLat, lte: query.neLat },
    lng: { gte: query.swLng, lte: query.neLng },
    // Prisma ignores `undefined`, so omitting city/town means "no filter"
    city: query.city,
    town: query.town,
  }

  const [rows, total] = await Promise.all([
    prisma.attraction.findMany({
      where,
      // description is up to ~2,400 chars per row; the list doesn't need it
      select: {
        id: true,
        name: true,
        city: true,
        town: true,
        lat: true,
        lng: true,
        isFree: true,
        favorites: favoriteOf(userId),
      },
      orderBy: { id: 'asc' },
      take: MAX_PLACES,
    }),
    prisma.attraction.count({ where }),
  ])

  const places = rows.map(({ favorites, ...place }) => ({
    ...place,
    isFavorite: favorites.length > 0,
  }))
  return { places, total }
}

export async function getPlace(id: string, userId: number | undefined): Promise<PlaceDetail> {
  const row = await prisma.attraction.findUnique({
    where: { id },
    include: { favorites: favoriteOf(userId) },
  })
  if (!row) {
    throw new HttpError('PLACE_NOT_FOUND')
  }
  const { favorites, ...place } = row
  return { ...place, isFavorite: favorites.length > 0 }
}

type SearchField = 'name' | 'city' | 'town'

// 每個詞都要在 fields 其中之一符合(詞與詞之間是 AND,欄位與寫法之間是 OR)
function termsWhere(terms: string[], fields: SearchField[]) {
  return {
    AND: terms.map((term) => ({
      OR: variantsOf(term).flatMap((v) =>
        fields.map((field) => ({
          [field]: { contains: escapeLike(v), mode: 'insensitive' as const },
        })),
      ),
    })),
  }
}

export async function search(q: string, userId: number | undefined): Promise<SearchResponse> {
  const terms = splitTerms(q)
  const [areas, places] = await Promise.all([searchAreas(terms), searchPlaces(terms, userId)])
  return { areas, places }
}

async function searchPlaces(terms: string[], userId: number | undefined) {
  const rows = await prisma.attraction.findMany({
    where: termsWhere(terms, ['name', 'city', 'town']),
    select: {
      id: true,
      name: true,
      city: true,
      town: true,
      lat: true,
      lng: true,
      isFree: true,
      favorites: favoriteOf(userId),
    },
    orderBy: { id: 'asc' },
  })

  return (
    rows
      .map(({ favorites, ...place }) => ({ ...place, isFavorite: favorites.length > 0 }))
      // 名稱就符合所有詞的排前面(找「阿里山」時,名字有阿里山的比位在阿里山鄉的更相關)
      .sort(
        (a, b) =>
          Number(terms.every((t) => includesTerm(b.name, t))) -
          Number(terms.every((t) => includesTerm(a.name, t))),
      )
      .slice(0, MAX_SEARCH_RESULTS)
  )
}

interface AreaStats {
  count: number
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

function mergeStats(a: AreaStats | undefined, b: AreaStats): AreaStats {
  if (!a) return b
  return {
    count: a.count + b.count,
    swLat: Math.min(a.swLat, b.swLat),
    swLng: Math.min(a.swLng, b.swLng),
    neLat: Math.max(a.neLat, b.neLat),
    neLng: Math.max(a.neLng, b.neLng),
  }
}

const toArea = (city: string, town: string | null, s: AreaStats): SearchArea => ({
  city,
  town,
  count: s.count,
  bounds: { swLat: s.swLat, swLng: s.swLng, neLat: s.neLat, neLng: s.neLng },
})

// 縣市共 22 個、鄉鎮 348 組,依「縣市+鄉鎮」彙總後在程式裡判斷:
// - 縣市地區:每個詞都符合縣市名稱(「臺北」→ 臺北市)
// - 鄉鎮地區:每個詞符合縣市或鄉鎮,且至少一個詞符合鄉鎮(「臺北 中正」→ 臺北市中正區)
// 鄉鎮名稱會重複(中正區在臺北市和基隆市),所以一定要連縣市一起看
async function searchAreas(terms: string[]): Promise<SearchArea[]> {
  const groups = await prisma.attraction.groupBy({
    by: ['city', 'town'],
    where: termsWhere(terms, ['city', 'town']),
    _count: { _all: true },
    _min: { lat: true, lng: true },
    _max: { lat: true, lng: true },
  })

  const cities = new Map<string, AreaStats>()
  const towns: SearchArea[] = []

  for (const g of groups) {
    const stats: AreaStats = {
      count: g._count._all,
      swLat: g._min.lat ?? 0,
      swLng: g._min.lng ?? 0,
      neLat: g._max.lat ?? 0,
      neLng: g._max.lng ?? 0,
    }
    if (terms.every((t) => includesTerm(g.city, t))) {
      cities.set(g.city, mergeStats(cities.get(g.city), stats))
    }
    if (
      terms.every((t) => includesTerm(g.city, t) || includesTerm(g.town, t)) &&
      terms.some((t) => includesTerm(g.town, t))
    ) {
      towns.push(toArea(g.city, g.town, stats))
    }
  }

  const byCount = (a: SearchArea, b: SearchArea) => b.count - a.count
  return [
    ...[...cities].map(([city, s]) => toArea(city, null, s)).sort(byCount),
    ...towns.sort(byCount),
  ].slice(0, MAX_SEARCH_AREAS)
}

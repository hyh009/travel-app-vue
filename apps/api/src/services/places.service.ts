import type { PlaceDetail, PlacesQuery, PlacesResponse } from '@travel/shared'
import { HttpError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

const MAX_PLACES = 200

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

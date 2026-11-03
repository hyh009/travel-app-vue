import type { PlaceDetail, PlacesQuery, PlacesResponse } from '@travel/shared'
import { HttpError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

const MAX_PLACES = 200

export async function listInBounds(query: PlacesQuery): Promise<PlacesResponse> {
  const where = {
    lat: { gte: query.swLat, lte: query.neLat },
    lng: { gte: query.swLng, lte: query.neLng },
  }

  const [places, total] = await Promise.all([
    prisma.attraction.findMany({
      where,
      // description is up to ~2,400 chars per row; the list doesn't need it
      select: { id: true, name: true, city: true, town: true, lat: true, lng: true, isFree: true },
      orderBy: { id: 'asc' },
      take: MAX_PLACES,
    }),
    prisma.attraction.count({ where }),
  ])

  return { places, total }
}

export async function getPlace(id: string): Promise<PlaceDetail> {
  const place = await prisma.attraction.findUnique({ where: { id } })
  if (!place) {
    throw new HttpError('PLACE_NOT_FOUND')
  }
  return place
}

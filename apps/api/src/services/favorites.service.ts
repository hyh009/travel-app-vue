import type { FavoritesQuery, FavoritesResponse } from '@travel/shared'
import { HttpError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

export async function list(userId: number, query: FavoritesQuery): Promise<FavoritesResponse> {
  const { page, pageSize } = query

  const [rows, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      select: {
        attraction: {
          select: {
            id: true,
            name: true,
            city: true,
            town: true,
            lat: true,
            lng: true,
            isFree: true,
          },
        },
      },
      // attractionId breaks ties, so rows saved in the same millisecond don't shuffle between pages
      orderBy: [{ createdAt: 'desc' }, { attractionId: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.favorite.count({ where: { userId } }),
  ])

  const places = rows.map(({ attraction }) => ({ ...attraction, isFavorite: true }))
  return { places, total, page, pageSize }
}

// Idempotent: saving something already saved is a success, not a conflict.
export async function add(userId: number, attractionId: string): Promise<void> {
  const exists = await prisma.attraction.findUnique({
    where: { id: attractionId },
    select: { id: true },
  })
  if (!exists) {
    throw new HttpError('PLACE_NOT_FOUND')
  }
  await prisma.favorite.upsert({
    where: { userId_attractionId: { userId, attractionId } },
    create: { userId, attractionId },
    update: {},
  })
}

// Idempotent as well: deleteMany doesn't throw when nothing matches.
export async function remove(userId: number, attractionId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, attractionId } })
}

import type { FavoritesResponse } from '@travel/shared'
import { favoritesQuerySchema } from '@travel/shared'
import { Router } from 'express'
import type { Request } from 'express'
import { HttpError } from '../lib/errors.js'
import { parseQuery } from '../lib/validate.js'
import { requireAuth } from '../middleware/requireAuth.js'
import * as favoritesService from '../services/favorites.service.js'

const router = Router()

router.use(requireAuth)

function userIdOf(req: Request): number {
  if (!req.userId) {
    throw new HttpError('NOT_AUTHENTICATED')
  }
  return req.userId
}

router.get('/', async (req, res) => {
  const query = parseQuery(favoritesQuerySchema, req.query)
  res.json((await favoritesService.list(userIdOf(req), query)) satisfies FavoritesResponse)
})

router.put('/:attractionId', async (req, res) => {
  await favoritesService.add(userIdOf(req), req.params.attractionId)
  res.status(204).end()
})

router.delete('/:attractionId', async (req, res) => {
  await favoritesService.remove(userIdOf(req), req.params.attractionId)
  res.status(204).end()
})

export default router

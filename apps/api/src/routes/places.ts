import type { PlaceDetailResponse, PlacesResponse } from '@travel/shared'
import { placesQuerySchema } from '@travel/shared'
import { Router } from 'express'
import { parseQuery } from '../lib/validate.js'
import { optionalAuth } from '../middleware/requireAuth.js'
import * as placesService from '../services/places.service.js'

const router = Router()

router.use(optionalAuth)

router.get('/', async (req, res) => {
  const query = parseQuery(placesQuerySchema, req.query)
  res.json((await placesService.listInBounds(query, req.userId)) satisfies PlacesResponse)
})

router.get('/:id', async (req, res) => {
  const place = await placesService.getPlace(req.params.id, req.userId)
  res.json({ place } satisfies PlaceDetailResponse)
})

export default router

import { Router } from 'express'
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from '../lib/cookies.js'
import { HttpError } from '../lib/errors.js'
import { parseBody } from '../lib/validate.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loginSchema, registerSchema } from '../schemas/auth.js'
import * as authService from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req, res) => {
  const input = parseBody(registerSchema, req.body)
  const { user, tokens } = await authService.register(input)
  setAuthCookies(res, tokens)
  res.status(201).json({ user })
})

router.post('/login', async (req, res) => {
  const input = parseBody(loginSchema, req.body)
  const { user, tokens } = await authService.login(input)
  setAuthCookies(res, tokens)
  res.json({ user })
})

router.post('/refresh', async (req, res) => {
  try {
    const tokens = await authService.refresh(req.cookies?.[REFRESH_COOKIE])
    setAuthCookies(res, tokens)
    res.status(204).end()
  } catch (err) {
    clearAuthCookies(res)
    throw err
  }
})

router.post('/logout', async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE])
  clearAuthCookies(res)
  res.status(204).end()
})

router.get('/me', requireAuth, async (req, res) => {
  if (!req.userId) {
    throw new HttpError('NOT_AUTHENTICATED')
  }
  res.json({ user: await authService.getUser(req.userId) })
})

export default router

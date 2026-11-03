import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../lib/config.js'
import { ACCESS_COOKIE } from '../lib/cookies.js'
import { HttpError } from '../lib/errors.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE]
  if (!token) {
    next(new HttpError('NOT_AUTHENTICATED'))
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload
    req.userId = Number(payload.sub)
    next()
  } catch {
    next(new HttpError('INVALID_ACCESS_TOKEN'))
  }
}

// For routes that work for guests but return more for a logged-in user.
// No token means guest; a token that is present but bad is still a 401, so the
// client refreshes instead of silently being treated as a guest.
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.[ACCESS_COOKIE]) {
    next()
    return
  }
  requireAuth(req, res, next)
}

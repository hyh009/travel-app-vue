import type { ApiErrorBody, ErrorCode } from '@travel/shared'
import type { NextFunction, Request, Response } from 'express'
import { HttpError, errors } from '../lib/errors.js'

function send(res: Response, code: ErrorCode, details?: unknown) {
  const body: ApiErrorBody = {
    error: { code, message: errors[code].message, details },
  }
  res.status(errors[code].status).json(body)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    send(res, err.code, err.details)
    return
  }
  // express.json() throws this when the request body is malformed JSON.
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  ) {
    send(res, 'INVALID_JSON')
    return
  }
  console.error(err)
  send(res, 'INTERNAL_ERROR')
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError('NOT_FOUND'))
}

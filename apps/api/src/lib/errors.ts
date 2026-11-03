import type { ErrorCode } from '@travel/shared'

export const errors: Record<ErrorCode, { status: number; message: string }> = {
  // 400
  VALIDATION_FAILED: { status: 400, message: 'Invalid input' },
  INVALID_JSON: { status: 400, message: 'Request body is not valid JSON' },
  // 401
  NOT_AUTHENTICATED: { status: 401, message: 'Not authenticated' },
  INVALID_ACCESS_TOKEN: { status: 401, message: 'Invalid or expired access token' },
  INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
  NO_REFRESH_TOKEN: { status: 401, message: 'No refresh token' },
  INVALID_REFRESH_TOKEN: { status: 401, message: 'Invalid refresh token' },
  USER_NOT_FOUND: { status: 401, message: 'User no longer exists' },
  // 404
  NOT_FOUND: { status: 404, message: 'Route not found' },
  PLACE_NOT_FOUND: { status: 404, message: 'Place not found' },
  // 409
  EMAIL_TAKEN: { status: 409, message: 'Email already registered' },
  // 500
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
}

export class HttpError extends Error {
  code: ErrorCode
  status: number
  details?: unknown

  constructor(code: ErrorCode, details?: unknown) {
    super(errors[code].message)
    this.name = 'HttpError'
    this.code = code
    this.status = errors[code].status
    this.details = details
  }
}

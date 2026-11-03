export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'INVALID_JSON',
  'NOT_AUTHENTICATED',
  'INVALID_ACCESS_TOKEN',
  'INVALID_CREDENTIALS',
  'NO_REFRESH_TOKEN',
  'INVALID_REFRESH_TOKEN',
  'USER_NOT_FOUND',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'INTERNAL_ERROR',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export interface ValidationDetails {
  formErrors: string[]
  fieldErrors: Record<string, string[] | undefined>
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}

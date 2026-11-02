import { z } from 'zod'
import { HttpError } from './errors.js'

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.output<T> {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new HttpError('VALIDATION_FAILED', z.flattenError(parsed.error))
  }
  return parsed.data
}

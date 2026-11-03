import { z } from 'zod'
import { HttpError } from './errors.js'

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new HttpError('VALIDATION_FAILED', z.flattenError(parsed.error))
  }
  return parsed.data
}

export const parseBody = parse
export const parseQuery = parse

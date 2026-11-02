import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
})

export const registerSchema = loginSchema.extend({
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(50).optional(),
})

export type LoginInput = z.output<typeof loginSchema>
export type RegisterInput = z.output<typeof registerSchema>

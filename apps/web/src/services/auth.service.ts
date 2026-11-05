import type { AuthResponse, LoginInput, RegisterInput } from '@travel/shared'
import { request } from '@/api/client'

export function login(input: LoginInput) {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

export function register(input: RegisterInput) {
  return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) })
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' })
}

export function fetchMe() {
  return request<AuthResponse>('/auth/me')
}

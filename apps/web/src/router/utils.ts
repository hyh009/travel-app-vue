export const ROUTE_NAME = {
  HOME: 'home',
  LOGIN: 'login',
  REGISTER: 'register',
  FAVORITES: 'favorites',
} as const

export function safeRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

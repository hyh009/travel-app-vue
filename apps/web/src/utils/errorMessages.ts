import type { ErrorCode } from '@travel/shared'
import { ApiError } from '@/api/error'

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: '輸入的資料格式不正確',
  INVALID_JSON: '送出的資料格式有誤',
  NOT_AUTHENTICATED: '請先登入',
  INVALID_ACCESS_TOKEN: '登入已過期,請重新登入',
  INVALID_CREDENTIALS: 'Email 或密碼錯誤',
  NO_REFRESH_TOKEN: '請先登入',
  INVALID_REFRESH_TOKEN: '登入已過期,請重新登入',
  USER_NOT_FOUND: '找不到這個使用者',
  NOT_FOUND: '找不到資料',
  EMAIL_TAKEN: '這個 Email 已經註冊過了',
  INTERNAL_ERROR: '伺服器發生問題,請稍後再試',
  PLACE_NOT_FOUND: '找不到這個景點',
}

export function errorMessage(err: unknown) {
  return err instanceof ApiError ? ERROR_MESSAGES[err.code] : '網路發生問題,請稍後再試'
}

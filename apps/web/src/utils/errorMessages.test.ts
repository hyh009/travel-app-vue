import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/error'
import { errorMessage } from './errorMessages'

describe('errorMessage', () => {
  it('ApiError 依錯誤代碼回對應的中文', () => {
    expect(errorMessage(new ApiError('EMAIL_TAKEN', 409))).toBe('這個 Email 已經註冊過了')
    expect(errorMessage(new ApiError('INVALID_CREDENTIALS', 401))).toBe('Email 或密碼錯誤')
  })

  it('不是 ApiError(例如斷線)回網路問題', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe('網路發生問題,請稍後再試')
  })
})

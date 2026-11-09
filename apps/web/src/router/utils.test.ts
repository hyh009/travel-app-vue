import { describe, expect, it } from 'vitest'
import { safeRedirect } from './utils'

describe('safeRedirect', () => {
  it('站內路徑原樣回傳(含 query)', () => {
    expect(safeRedirect('/favorites')).toBe('/favorites')
    expect(safeRedirect('/?lat=23&lng=121')).toBe('/?lat=23&lng=121')
  })

  it.each([
    ['外部網址', 'https://evil.com'],
    ['協定相對網址(//開頭)', '//evil.com'],
    ['沒有斜線開頭', 'favorites'],
    ['空字串', ''],
    ['不是字串', ['/a']],
    ['undefined', undefined],
  ])('%s 一律回首頁', (_name, value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})

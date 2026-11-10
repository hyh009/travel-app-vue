import { describe, expect, it } from 'vitest'
import { escapeLike, includesTerm, splitTerms, variantsOf } from './searchTerms.js'

describe('splitTerms', () => {
  it('用空白切開,忽略多餘空白,最多 5 個詞', () => {
    expect(splitTerms('花蓮  太魯閣')).toEqual(['花蓮', '太魯閣'])
    expect(splitTerms('a b c d e f g')).toHaveLength(5)
  })
})

describe('variantsOf', () => {
  it('台與臺兩種寫法都產生', () => {
    expect(variantsOf('台北')).toEqual(['台北', '臺北'])
    expect(variantsOf('臺北')).toEqual(['臺北', '台北'])
  })

  it('沒有台/臺時只有原詞', () => {
    expect(variantsOf('花蓮')).toEqual(['花蓮'])
  })
})

describe('includesTerm', () => {
  it('台/臺互通、英文不分大小寫', () => {
    expect(includesTerm('臺北市', '台北')).toBe(true)
    expect(includesTerm('Sun Moon Lake', 'MOON')).toBe(true)
    expect(includesTerm('花蓮縣', '台北')).toBe(false)
  })
})

describe('escapeLike', () => {
  it('跳脫 %、_ 與反斜線', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
  })
})

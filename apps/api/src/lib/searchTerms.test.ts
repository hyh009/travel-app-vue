import { describe, expect, it } from 'vitest'
import { escapeLike, includesTerm, splitCityPrefix, splitTerms, variantsOf } from './searchTerms.js'

describe('splitTerms', () => {
  it('用空白切開,忽略多餘空白,最多 5 個詞', () => {
    expect(splitTerms('花蓮  太魯閣')).toEqual(['花蓮', '太魯閣'])
    expect(splitTerms('a b c d e f g')).toHaveLength(5)
  })
})

describe('splitCityPrefix', () => {
  it('縣市加鄉鎮連在一起時拆成兩個詞(台/臺、有無「市」都可以)', () => {
    expect(splitCityPrefix('台北市中正區')).toEqual(['台北市', '中正區'])
    expect(splitCityPrefix('臺北市中正區')).toEqual(['臺北市', '中正區'])
    expect(splitCityPrefix('台北中正區')).toEqual(['台北', '中正區'])
    expect(splitCityPrefix('新北市永和區')).toEqual(['新北市', '永和區'])
    expect(splitCityPrefix('彰化縣員林市')).toEqual(['彰化縣', '員林市'])
    expect(splitCityPrefix('嘉義市東區')).toEqual(['嘉義市', '東區'])
  })

  it.each([
    ['新北投溫泉', '開頭像「新北」,但剩下的不像鄉鎮'],
    ['台北101', '剩下的是數字'],
    ['台北市立動物園', '剩下的不以區鄉鎮市結尾'],
    ['花蓮市', '縣市名本身,沒有剩餘部分'],
    ['台北市', '縣市名本身'],
    ['中正區', '沒有縣市前綴'],
    ['日月潭', '一般景點名稱'],
  ])('不該拆:%s(%s)', (term) => {
    expect(splitCityPrefix(term)).toEqual([term])
  })

  it('splitTerms 會對每個詞拆,且總數仍不超過 5 個', () => {
    expect(splitTerms('台北市中正區')).toEqual(['台北市', '中正區'])
    expect(splitTerms('台北市中正區 故宮')).toEqual(['台北市', '中正區', '故宮'])
    expect(splitTerms('台北市中正區 新北市永和區 花蓮縣吉安鄉')).toHaveLength(5)
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

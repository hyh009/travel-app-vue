import { describe, expect, it } from 'vitest'
import { buildAttractionRecords, toAttractionRecord } from './officialAttraction.js'

const official = {
  AttractionID: 'Attraction_1',
  AttractionName: ' 太平山 ',
  Description: '簡介',
  PositionLat: 24.5,
  PositionLon: 121.5,
  PostalAddress: { City: '宜蘭縣', Town: '大同鄉', ZipCode: '267' },
  WebsiteURL: 'https://example.com',
  IsAccessibleForFree: 1,
  Images: [{ URL: 'https://example.com/a.jpg' }],
}

describe('toAttractionRecord', () => {
  it('轉成匯入格式,只取用到的欄位,名稱去掉前後空白', () => {
    expect(toAttractionRecord(official)).toEqual({
      id: 'Attraction_1',
      name: '太平山',
      description: '簡介',
      city: '宜蘭縣',
      town: '大同鄉',
      lat: 24.5,
      lon: 121.5,
      is_free: true,
      website: 'https://example.com',
    })
  })

  it.each([
    [1, true],
    [0, false],
    [null, null],
    [undefined, null],
  ])('IsAccessibleForFree = %s → is_free = %s(沒資料不能當成收費)', (input, expected) => {
    expect(toAttractionRecord({ ...official, IsAccessibleForFree: input })?.is_free).toBe(expected)
  })

  it('沒有網址、簡介或鄉鎮時給預設值', () => {
    const record = toAttractionRecord({
      ...official,
      WebsiteURL: '  ',
      Description: null,
      PostalAddress: { City: '宜蘭縣' },
    })
    expect(record).toMatchObject({ website: null, description: '', town: '' })
  })

  it.each([
    ['缺縣市', { PostalAddress: { City: '' } }],
    ['座標超出範圍', { PositionLat: 200 }],
    ['座標不是數字', { PositionLon: '121.5' }],
    ['沒有名稱', { AttractionName: '  ' }],
  ])('無效資料回傳 null:%s', (_name, patch) => {
    expect(toAttractionRecord({ ...official, ...patch })).toBeNull()
  })
})

describe('buildAttractionRecords', () => {
  it('依 id 排序,並回報被略過的筆數', () => {
    const { records, skipped } = buildAttractionRecords([
      { ...official, AttractionID: 'b' },
      { ...official, AttractionID: 'a' },
      { ...official, AttractionID: 'bad', PositionLat: 999 },
    ])
    expect(records.map((r) => r.id)).toEqual(['a', 'b'])
    expect(skipped).toBe(1)
  })
})

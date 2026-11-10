import { describe, expect, it } from 'vitest'
import { minZoomFor } from './map'

describe('minZoomFor', () => {
  it('桌機大小的地圖至少要縮放到 12', () => {
    expect(minZoomFor(1280, 800, 23.5)).toBe(12)
  })

  it('手機大小的地圖至少要縮放到 11', () => {
    expect(minZoomFor(390, 400, 23.5)).toBe(11)
  })

  it('容器越大,最小縮放等級越高', () => {
    expect(minZoomFor(2560, 800, 23.5)).toBeGreaterThan(minZoomFor(1280, 800, 23.5))
  })

  it('容器是 0 的時候不會回傳負數', () => {
    expect(minZoomFor(0, 0, 23.5)).toBe(0)
  })
})

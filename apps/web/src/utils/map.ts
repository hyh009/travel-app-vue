import type L from 'leaflet'
import { MAX_SPAN_DEGREES } from '@travel/shared'

// 小數 5 位約 1 公尺
export const round = (n: number) => Math.round(n * 1e5) / 1e5

const TILE_SIZE = 256

// 讓整個畫面涵蓋的範圍(寬和高)都不超過後端上限 MAX_SPAN_DEGREES 的最小縮放等級。
// 縮放等級 z 時,世界寬 256 × 2^z 像素 = 360°,所以每個像素 360 / (256 × 2^z) 度;
// 解「像素 × 每像素度數 ≤ 上限」就得到 z。容器越大,同一個縮放等級涵蓋的範圍越大,下限就越高。
export function minZoomFor(width: number, height: number, lat: number): number {
  const zoomFor = (pixels: number) => Math.log2((pixels * 360) / (TILE_SIZE * MAX_SPAN_DEGREES))
  // 緯度方向每像素的度數比經度小 cos(緯度) 倍
  const latPixels = height * Math.cos((lat * Math.PI) / 180)
  // 容器還沒有大小(例如被隱藏)時 log2(0) 是 -Infinity,這裡退回 0
  return Math.max(0, Math.ceil(Math.max(zoomFor(width), zoomFor(latPixels))))
}

export function markerStyle(selected: boolean): L.CircleMarkerOptions {
  return selected
    ? { radius: 12, weight: 4, color: '#f2c14e', fillColor: '#37474f', fillOpacity: 1 }
    : { radius: 8, weight: 2, color: '#37474f', fillColor: '#f2c14e', fillOpacity: 0.95 }
}

// tooltip 預設畫在標記上方;標記靠近地圖邊緣時會被容器裁掉,所以打開時依位置換方向
const TIP_EDGE_X = 130 // 約半個 tooltip 的寬度(max-width 220 + padding)
const TIP_EDGE_Y = 70 // 約一個 tooltip 的高度加箭頭
const TIP_HALF_H = 30 // 約半個 tooltip 的高度
const TIP_GAP = 8

export function placeTooltip(map: L.Map, tooltip: L.Tooltip, marker: L.CircleMarker) {
  const point = map.latLngToContainerPoint(marker.getLatLng())
  const size = map.getSize()

  // 左右方向時 tooltip 垂直置中,在上下角落會被裁掉,所以再往內推一點
  const shiftY = Math.max(TIP_HALF_H - point.y, 0) - Math.max(point.y - (size.y - TIP_HALF_H), 0)

  if (point.x < TIP_EDGE_X) {
    tooltip.options.direction = 'right'
    tooltip.options.offset = [TIP_GAP, shiftY]
  } else if (point.x > size.x - TIP_EDGE_X) {
    tooltip.options.direction = 'left'
    tooltip.options.offset = [-TIP_GAP, shiftY]
  } else if (point.y < TIP_EDGE_Y) {
    tooltip.options.direction = 'bottom'
    tooltip.options.offset = [0, TIP_GAP]
  } else {
    tooltip.options.direction = 'top'
    tooltip.options.offset = [0, -TIP_GAP]
  }
  tooltip.update() // 方向改了,重新定位
}

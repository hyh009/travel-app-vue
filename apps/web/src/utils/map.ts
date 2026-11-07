import type L from 'leaflet'

// 小數 5 位約 1 公尺
export const round = (n: number) => Math.round(n * 1e5) / 1e5

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

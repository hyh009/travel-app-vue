import type L from 'leaflet'

// 小數 5 位約 1 公尺
export const round = (n: number) => Math.round(n * 1e5) / 1e5

export function markerStyle(selected: boolean): L.CircleMarkerOptions {
  return selected
    ? { radius: 12, weight: 4, color: '#f2c14e', fillColor: '#37474f', fillOpacity: 1 }
    : { radius: 8, weight: 2, color: '#37474f', fillColor: '#f2c14e', fillOpacity: 0.95 }
}

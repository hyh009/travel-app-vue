import type L from 'leaflet'

// 小數 5 位約 1 公尺
export const round = (n: number) => Math.round(n * 1e5) / 1e5

export function markerStyle(selected: boolean): L.CircleMarkerOptions {
  return selected
    ? { radius: 12, color: '#ffb300', fillColor: '#ffb300', fillOpacity: 1 }
    : { radius: 8 }
}

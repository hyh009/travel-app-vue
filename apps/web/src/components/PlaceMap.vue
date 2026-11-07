<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PlacesQuery, PlaceSummary } from '@travel/shared'
import { round, markerStyle } from '@/utils/map'

const DEFAULT_MAP_CENTER: L.LatLngTuple = [25.04, 121.55]
const DEFAULT_ZOOM_VALUE = 14

// ── 對外介面 ──
interface Props {
  places: PlaceSummary[]
  selectedId: string | null
  hoveredId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'bounds-change': [bounds: PlacesQuery]
  select: [id: string]
}>()
defineExpose({ flyTo })

// ── 內部狀態 ──
// Leaflet 實例不用 ref:避免被 Vue 包成 Proxy
const container = useTemplateRef<HTMLDivElement>('mapContainer')
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
const markers = new Map<string, L.CircleMarker>()

// ── Function ──
function flyTo(lat: number, lng: number) {
  if (!map) return
  map.flyTo([lat, lng], Math.max(map.getZoom(), 15))
}

function emitBounds() {
  if (!map) return
  const b = map.getBounds()
  emit('bounds-change', {
    swLat: round(b.getSouth()),
    swLng: round(b.getWest()),
    neLat: round(b.getNorth()),
    neLng: round(b.getEast()),
  })
}

// 讓地圖上的標記和 props.places 一致:多的刪掉、少的補上、已經有的不動
function syncMarkers() {
  if (!layer) return
  const ids = new Set(props.places.map((p) => p.id))

  for (const [id, marker] of markers) {
    if (!ids.has(id)) {
      layer.removeLayer(marker)
      markers.delete(id)
    }
  }

  for (const place of props.places) {
    if (markers.has(place.id)) continue
    const marker = L.circleMarker(
      [place.lat, place.lng],
      markerStyle(place.id === props.selectedId),
    )
      .bindTooltip(place.name, { direction: 'top', offset: [0, -8], className: 'place-tip' })
      .on('click', () => emit('select', place.id))
      .addTo(layer)
    markers.set(place.id, marker)
    if (place.id === props.hoveredId) marker.openTooltip()
  }
}

// ── 生命週期 ──
onMounted(() => {
  if (!container.value) return
  map = L.map(container.value, { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_ZOOM_VALUE })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)

  layer = L.layerGroup().addTo(map)

  map.on('moveend', emitBounds)
  emitBounds()
  syncMarkers()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  layer = null
  markers.clear()
})

// ── 監聽 ──
watch(() => props.places, syncMarkers)

watch(
  () => props.selectedId,
  (next, prev) => {
    if (prev) markers.get(prev)?.setStyle(markerStyle(false))
    if (next) {
      const marker = markers.get(next)
      marker?.setStyle(markerStyle(true))
      marker?.bringToFront()
    }
  },
)

watch(
  () => props.hoveredId,
  (next, prev) => {
    if (prev) markers.get(prev)?.closeTooltip()
    if (next) markers.get(next)?.openTooltip()
  },
)
</script>

<template>
  <div
    ref="mapContainer"
    class="map"
  />
</template>

<style scoped>
.map {
  width: 100%;
  height: 100%;
}
</style>

<style>
/* tooltip 是 Leaflet 自己建立的 DOM,不在這個元件的 scope 內,所以用全域樣式 */
.place-tip {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 35%);
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #263238;
  /* Leaflet 預設 0.9 的透明度,地圖文字會透出來 */
  opacity: 1;
  /* Leaflet 預設不換行;長名稱限制寬度後換行 */
  max-width: 220px;
  white-space: normal;
  width: max-content;
}
.place-tip.leaflet-tooltip-top::before {
  border-top-color: #fff;
}
</style>

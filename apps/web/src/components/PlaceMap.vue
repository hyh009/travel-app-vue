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

function renderMarkers() {
  if (!layer) return
  layer.clearLayers()
  for (const place of props.places) {
    L.circleMarker([place.lat, place.lng], markerStyle(place.id === props.selectedId))
      .bindTooltip(place.name, { direction: 'top', offset: [0, -8], className: 'place-tip' })
      .on('click', () => emit('select', place.id))
      .addTo(layer)
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
  renderMarkers()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  layer = null
})

// ── 監聽 ──
watch([() => props.places, () => props.selectedId], renderMarkers)
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

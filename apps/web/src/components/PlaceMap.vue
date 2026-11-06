<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PlacesQuery, PlaceSummary } from '@travel/shared'

const DEFAULT_MAP_CENTER: L.LatLngTuple = [25.04, 121.55]
const DEFAULT_ZOOM_VALUE = 14

// ── 對外介面 ──
interface Props {
  places: PlaceSummary[]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  'bounds-change': [bounds: PlacesQuery]
}>()

// ── 內部狀態 ──
// Leaflet 實例不用 ref:避免被 Vue 包成 Proxy
const container = useTemplateRef<HTMLDivElement>('mapContainer')
let map: L.Map | null = null
let layer: L.LayerGroup | null = null

// ── 函式 ──
// 小數 5 位約 1 公尺
const round = (n: number) => Math.round(n * 1e5) / 1e5

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
    L.circleMarker([place.lat, place.lng], { radius: 8 }).addTo(layer)
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
watch(() => props.places, renderMarkers)
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

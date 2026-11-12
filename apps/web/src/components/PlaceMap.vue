<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PlaceSummary, SearchArea, Viewport } from '@travel/shared'
import { round, markerStyle, placeTooltip, minZoomFor } from '@/utils/map'

const DEFAULT_MAP_CENTER: L.LatLngTuple = [25.04, 121.55]
const DEFAULT_ZOOM_VALUE = 14

// ── 對外介面 ──
interface Props {
  places: PlaceSummary[]
  selectedId: string | null
  hoveredId: string | null
  // 地圖下緣被 bottom sheet 蓋住的高度(px)。飛過去、放進畫面時,要讓目標落在「看得到的那塊」中央
  bottomInset?: number
}

const props = withDefaults(defineProps<Props>(), { bottomInset: 0 })
const emit = defineEmits<{
  'bounds-change': [bounds: Viewport]
  select: [id: string]
}>()
defineExpose({ flyTo, fitBounds })

// ── 內部狀態 ──
// Leaflet 實例不用 ref:避免被 Vue 包成 Proxy
const container = useTemplateRef<HTMLDivElement>('mapContainer')
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
const markers = new Map<string, L.CircleMarker>()
let resizeObserver: ResizeObserver | null = null

// ── Function ──
// 飛得很遠(例如從北部搜到南投)時,Leaflet 預設的飛行動畫要 4~5 秒,這段時間列表沒有任何回饋,
// 看起來像沒反應。遠距離固定 1.5 秒;近距離維持預設,因為預設本來就比較快
const FAR_FLY_METERS = 30_000
const FAR_FLY_SECONDS = 1.5

function flyTo(lat: number, lng: number) {
  if (!map) return
  const zoom = Math.max(map.getZoom(), 15)
  // 下緣被蓋住時,地圖中心要比目標再往下半個被蓋住的高度,目標才會在看得到的那塊中央
  const center = map.unproject(map.project([lat, lng], zoom).add([0, props.bottomInset / 2]), zoom)
  const far = map.getCenter().distanceTo(center) > FAR_FLY_METERS
  map.flyTo(center, zoom, far ? { duration: FAR_FLY_SECONDS } : undefined)
}

// 把一個地區的外框放進畫面。縮放不會低於最小縮放(大縣市會停在中心附近);
// maxZoom 避免只有一個景點的地區(外框是一個點)縮到最近
function fitBounds(b: SearchArea['bounds']) {
  if (!map) return
  map.fitBounds(
    [
      [b.swLat, b.swLng],
      [b.neLat, b.neLng],
    ],
    // 不播動畫:篩選條件和畫面範圍同時就位,只查一次(動畫中會先用舊範圍查出空結果而閃一下)
    { maxZoom: 15, animate: false, paddingBottomRight: [0, props.bottomInset] },
  )
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
      .on('tooltipopen', (e: L.TooltipEvent) => map && placeTooltip(map, e.tooltip, marker))
      .addTo(layer)
    markers.set(place.id, marker)
    if (place.id === props.hoveredId) marker.openTooltip()
  }
}

function updateMinZoom() {
  if (!map) return
  map.invalidateSize()
  const { x, y } = map.getSize()
  map.setMinZoom(minZoomFor(x, y, map.getCenter().lat))
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

  resizeObserver = new ResizeObserver(updateMinZoom)
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
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
/* 觸控裝置用雙指縮放,不需要按鈕(會擋畫面) */
@media (pointer: coarse) {
  .leaflet-control-zoom {
    display: none;
  }
}

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
.place-tip.leaflet-tooltip-bottom::before {
  border-bottom-color: #fff;
}
.place-tip.leaflet-tooltip-left::before {
  border-left-color: #fff;
}
.place-tip.leaflet-tooltip-right::before {
  border-right-color: #fff;
}
</style>

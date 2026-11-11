<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, onMounted } from 'vue'
import { mdiAlertCircleOutline, mdiAlertOutline, mdiCrosshairsGps } from '@mdi/js'
import type { PlaceSummary, SearchArea, Viewport } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'
import SearchBox from '@/components/SearchBox.vue'
import { useFavoriteMutation } from '@/composables/useFavoriteMutation'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useRouter, useRoute } from 'vue-router'
import { ROUTE_NAME } from '@/router/utils'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

// 畫面範圍由地圖決定,每次拖曳都會整個換掉;地區篩選由使用者操作決定。兩者分開存
const bounds = ref<Viewport | null>(null)
const areaFilter = ref<SearchArea | null>(null)
// 標籤和空狀態都要顯示的地區名稱,例如「新北市永和區」
const areaLabel = computed(
  () => areaFilter.value && `${areaFilter.value.city}${areaFilter.value.town ?? ''}`,
)
const selectedId = ref<string | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listContainer')
const mapRef = useTemplateRef<InstanceType<typeof PlaceMap>>('placeMap')
const hoveredId = ref<string | null>(null)

// 送給後端的查詢 = 畫面範圍 + 地區篩選(沒篩選時 city、town 是 undefined,不會送出)
const placesQuery = computed(() => {
  if (!bounds.value) return null
  const area = areaFilter.value
  return { ...bounds.value, city: area?.city, town: area?.town ?? undefined }
})

const { data, loading, error, setFavorite } = usePlaces(placesQuery, () => auth.user?.id)
const { toggleFavorite, changeFavorite } = useFavoriteMutation(setFavorite)

// 地圖範圍的狀態提示,浮在地圖上:載入失敗 > 景點太多(後端有筆數上限)
interface MapNotice {
  type: 'warning' | 'error'
  text: string
}
// 範圍內沒有景點:是列表的空狀態,不是地圖的警告。載入中、載入失敗時不算
const isEmpty = computed(
  () => !loading.value && !error.value && !!data.value && data.value.places.length === 0,
)
const mapNotice = computed<MapNotice | null>(() => {
  if (error.value) return { type: 'error', text: '載入失敗,請稍後再試' }
  if (loading.value || !data.value) return null
  const { places, total } = data.value
  if (total > places.length) {
    return { type: 'warning', text: `顯示 ${places.length} / ${total} 個,放大地圖可發現更多景點` }
  }
  return null
})

function handleBoundsChange(value: Viewport) {
  bounds.value = value
}

function handleSelectIdChange(id: string) {
  selectedId.value = id
}

function handleHoverIdChange(id: string | null) {
  hoveredId.value = id
}

function clearAreaFilter() {
  areaFilter.value = null
}

function handleFocusCard(id: string) {
  selectedId.value = id
  const targetPlace = data.value?.places.find((p) => p.id === id)
  if (!targetPlace) return
  mapRef.value?.flyTo(targetPlace.lat, targetPlace.lng)
}

// 搜尋選到景點:用搜尋結果自己的座標飛過去(它通常還不在目前載入的清單裡)
function handleSearchPlace(place: PlaceSummary) {
  areaFilter.value = null
  selectedId.value = place.id
  mapRef.value?.flyTo(place.lat, place.lng)
}

function focusArea() {
  if (!areaFilter.value) return
  mapRef.value?.fitBounds(areaFilter.value.bounds)
}

// 搜尋選到地區:把地區外框放進畫面,不選任何景點
function handleSearchArea(area: SearchArea) {
  selectedId.value = null
  areaFilter.value = area
  focusArea()
}

function scrollToSelected() {
  const id = selectedId.value
  const el = id ? listRef.value?.querySelector(`[data-id="${CSS.escape(id)}"]`) : null
  if (el) el.scrollIntoView({ inline: 'center' })
  else listRef.value?.scrollTo({ top: 0 })
}

function handleToggleFavorite(attractionId: string) {
  if (!auth.isLoggedIn) {
    toast.show('請先登入才能收藏', 'info')
    const redirect = router.resolve({
      name: ROUTE_NAME.HOME,
      query: { favorite: attractionId },
    }).fullPath
    router.push({ name: ROUTE_NAME.LOGIN, query: { redirect } })
    return
  }
  if (!data.value) return
  const targetPlace = data.value.places.find((p) => p.id === attractionId)
  if (!targetPlace) return
  toggleFavorite(targetPlace)
}

function handleListWheel(e: WheelEvent) {
  const el = listRef.value
  if (!el) return
  if (el.scrollWidth <= el.clientWidth) return
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return

  e.preventDefault()
  el.scrollLeft += e.deltaY
}

onMounted(async () => {
  const id = route.query.favorite
  if (typeof id !== 'string' || !auth.isLoggedIn) return

  if (await changeFavorite(id, true)) toast.show('已加入收藏', 'success')
  router.replace({ query: {} })
})

// 景點清單換了之後:flush: 'post' 代表 DOM 已更新,不用 nextTick
// 監聽 id 組成的字串而不是 data 本身:按愛心也會換掉 data 物件,但清單沒變,不該捲動列表
watch(
  () => data.value?.places.map((p) => p.id).join(','),
  () => {
    if (selectedId.value && !data.value?.places.some((p) => p.id === selectedId.value)) {
      selectedId.value = null
    }
    scrollToSelected()
  },
  { flush: 'post' },
)

watch(selectedId, () => scrollToSelected(), {
  flush: 'post',
})
</script>
<template>
  <div class="main">
    <div
      ref="listContainer"
      class="list-container"
      @wheel="handleListWheel"
    >
      <PlaceList
        :places="data?.places ?? []"
        :loading="loading"
        :empty="isEmpty"
        :area-label="areaLabel"
        :selected-id="selectedId"
        @hover-card="handleHoverIdChange"
        @focus-card="handleFocusCard"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
    <div class="map-container">
      <SearchBox
        class="map-search"
        @select-place="handleSearchPlace"
        @select-area="handleSearchArea"
      />
      <v-chip
        v-if="areaFilter"
        class="map-filter"
        color="primary"
        variant="flat"
        closable
        close-label="取消地區篩選"
        :prepend-icon="mdiCrosshairsGps"
        @click="focusArea"
        @click:close="clearAreaFilter"
      >
        只顯示:{{ areaLabel }}
      </v-chip>
      <div
        v-if="mapNotice"
        class="map-notice"
        :class="[mapNotice.type, { 'below-filter': areaFilter }]"
      >
        <v-icon
          :icon="mapNotice.type === 'error' ? mdiAlertCircleOutline : mdiAlertOutline"
          size="18"
        />
        {{ mapNotice.text }}
      </div>
      <PlaceMap
        ref="placeMap"
        :places="data?.places ?? []"
        :selected-id="selectedId"
        :hovered-id="hoveredId"
        @bounds-change="handleBoundsChange"
        @select="handleSelectIdChange"
      />
    </div>
  </div>
</template>

<style scoped>
.main {
  display: flex;
  height: calc(100dvh - var(--v-layout-top));
}
.list-container {
  width: 400px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 12px;
}
.map-container {
  flex: 1;
  position: relative;
}

/* 浮在地圖上緣:左邊留出 Leaflet 縮放按鈕的位置 */
.map-search {
  position: absolute;
  top: 12px;
  left: 64px;
  width: min(420px, calc(100% - 76px));
  z-index: 1001;
}

/* 浮在搜尋框下面,提示目前只看某個地區 */
.map-filter {
  position: absolute;
  top: 64px;
  left: 64px;
  z-index: 1001;
  box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
}

/* 浮在搜尋框下面、地圖上緣中間;pointer-events: none 讓滑鼠和手指穿過去直接操作地圖 */
.map-notice {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  /* Leaflet 的控制按鈕是 1000,要蓋過地圖圖層 */
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  /* 兩側留出縮放按鈕的位置;太長的文字(手機)會換行 */
  width: max-content;
  max-width: calc(100% - 112px);
  padding: 6px 14px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
  font-size: 13px;
  font-weight: 500;
  /* 換行時兩行平均分配,避免最後一行只剩一個字 */
  text-wrap: balance;
  pointer-events: none;
}
.map-notice.below-filter {
  top: 108px;
}
.map-notice.warning {
  background: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-warning));
}
.map-notice.error {
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}

@media (max-width: 1024px) {
  .main {
    flex-direction: column-reverse;
  }
  .list-container {
    width: 100%;
    /* 固定高度:列表換內容時地圖大小不會跟著變 */
    height: 260px;
    flex: none;
    overflow-y: hidden;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .list-container::-webkit-scrollbar {
    display: none;
  }
}
</style>

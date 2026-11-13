<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, onMounted } from 'vue'
import { useMediaQuery, useWindowSize } from '@vueuse/core'
import { mdiAlertCircleOutline, mdiAlertOutline, mdiCrosshairsGps } from '@mdi/js'
import type { PlaceSummary, SearchArea, Viewport } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'
import PlaceSheet from '@/components/PlaceSheet.vue'
import SearchBox from '@/components/SearchBox.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import { useFavoriteMutation } from '@/composables/useFavoriteMutation'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useRouter, useRoute } from 'vue-router'
import { useAreaFilter } from '@/composables/useAreaFilter'
import { useSelection } from '@/composables/useSelection'
import { ROUTE_NAME } from '@/router/utils'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

// 畫面範圍由地圖決定,每次拖曳都會整個換掉;地區篩選由使用者操作決定。兩者分開存
const bounds = ref<Viewport | null>(null)

const { areaFilter, areaLabel, clearAreaFilter, setArea } = useAreaFilter()
const { selectedId, hoveredId, setSelectId, setHoverId } = useSelection()

const listRef = useTemplateRef<HTMLDivElement>('listContainer')
const mapRef = useTemplateRef<InstanceType<typeof PlaceMap>>('placeMap')
const sheetRef = useTemplateRef<InstanceType<typeof PlaceSheet>>('sheet')

// 用「裝置怎麼操作」而不是螢幕寬度判斷:觸控裝置用 bottom sheet,滑鼠用左右分割的列表
const isTouch = useMediaQuery('(pointer: coarse)')
const { height: windowHeight } = useWindowSize()
// sheet 半開時蓋住地圖下半部;飛過去、放進畫面時要把這塊讓出來
const mapBottomInset = computed(() => (isTouch.value ? Math.round(windowHeight.value / 2) : 0))

// 送給後端的查詢 = 畫面範圍 + 地區篩選(沒篩選時 city、town 是 undefined,不會送出)
const placesQuery = computed(() => {
  if (!bounds.value) return null
  const area = areaFilter.value
  return { ...bounds.value, city: area?.city, town: area?.town ?? undefined }
})

const { data, loading, error, setFavorite } = usePlaces(placesQuery, () => auth.user?.id)

// 飛行途中也會收到清單(舊範圍的查詢),那時目標還在地圖外,不能因為它不在清單裡就取消選取
const isFlying = ref(false)
// 飛行中列表還是舊範圍的內容:不能顯示成「沒有景點」或舊的筆數警告,要跟載入中一樣處理
const listLoading = computed(() => loading.value || isFlying.value)
const { toggleFavorite, changeFavorite } = useFavoriteMutation(setFavorite)

// 地圖範圍的狀態提示,浮在地圖上:載入失敗 > 景點太多(後端有筆數上限)
interface MapNotice {
  type: 'warning' | 'error'
  text: string
}
// 範圍內沒有景點:是列表的空狀態,不是地圖的警告。載入中、載入失敗時不算
const isEmpty = computed(
  () => !listLoading.value && !error.value && !!data.value && data.value.places.length === 0,
)
const mapNotice = computed<MapNotice | null>(() => {
  if (error.value) return { type: 'error', text: '載入失敗,請稍後再試' }
  if (listLoading.value || !data.value) return null
  const { places, total } = data.value
  if (total > places.length) {
    return { type: 'warning', text: `顯示 ${places.length} / ${total} 個,放大地圖可發現更多景點` }
  }
  return null
})

function handleBoundsChange(value: Viewport) {
  bounds.value = value
}

// 點地圖上的標記:選取,並把 sheet 拉到半開讓使用者看到對應的卡片
function handleMapSelect(id: string) {
  setSelectId(id)
  sheetRef.value?.snapTo('half')
}

function handleFocusCard(id: string) {
  setSelectId(id)
  const targetPlace = data.value?.places.find((p) => p.id === id)
  if (!targetPlace) return
  mapRef.value?.flyTo(targetPlace.lat, targetPlace.lng)
}

// 搜尋選到景點:用搜尋結果自己的座標飛過去(它通常還不在目前載入的清單裡)
async function handleSearchPlace(place: PlaceSummary) {
  clearAreaFilter()
  setSelectId(place.id)
  sheetRef.value?.snapTo('half')
  isFlying.value = true
  try {
    await mapRef.value?.flyTo(place.lat, place.lng)
  } finally {
    isFlying.value = false
  }
}

function focusArea() {
  if (!areaFilter.value) return
  mapRef.value?.fitBounds(areaFilter.value.bounds)
}

// 搜尋選到地區:把地區外框放進畫面,不選任何景點
function handleSearchArea(area: SearchArea) {
  setSelectId(null)
  setArea(area)
  sheetRef.value?.snapTo('half')
  focusArea()
}

function scrollToSelected() {
  const id = selectedId.value
  // 列表可能在左邊的容器,也可能在 bottom sheet 裡(傳送到 body),所以從整份文件找
  const el = id ? document.querySelector(`.place-list [data-id="${CSS.escape(id)}"]`) : null
  // 橫向排列要置中;sheet 裡是直向,貼到上緣最順
  if (el) el.scrollIntoView(isTouch.value ? { block: 'start' } : { inline: 'center' })
  // 沒有選取:列表回到最上面。手機的列表在 bottom sheet 裡,不是 listRef
  else if (isTouch.value) sheetRef.value?.scrollToTop()
  else listRef.value?.scrollTo({ top: 0 })
}

// 桌機的左側列表和 bottom sheet 裡的列表,吃同一組 props
const listProps = computed(() => ({
  places: data.value?.places ?? [],
  loading: listLoading.value,
  empty: isEmpty.value,
  areaLabel: areaLabel.value,
  selectedId: selectedId.value,
}))

// bottom sheet 標題列:收合時只看得到這一行
const sheetTitle = computed(() => {
  if (!data.value) return '載入中…'
  return `${areaLabel.value ?? '此範圍'} ${data.value.total} 個景點`
})

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
    if (
      selectedId.value &&
      !isFlying.value &&
      !data.value?.places.some((p) => p.id === selectedId.value)
    ) {
      setSelectId(null)
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
      v-if="!isTouch"
      ref="listContainer"
      class="list-container"
      @wheel="handleListWheel"
    >
      <PlaceList
        v-bind="listProps"
        @hover-card="setHoverId"
        @focus-card="handleFocusCard"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
    <div class="map-container">
      <!-- 觸控裝置:點了開全螢幕搜尋頁(鍵盤佔掉半個畫面,行內下拉選單不好用);滑鼠裝置:行內下拉 -->
      <SearchDialog
        v-if="isTouch"
        class="map-search"
        @select-place="handleSearchPlace"
        @select-area="handleSearchArea"
      />
      <SearchBox
        v-else
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
        :bottom-inset="mapBottomInset"
        @bounds-change="handleBoundsChange"
        @select="handleMapSelect"
      />
    </div>
    <PlaceSheet
      v-if="isTouch"
      ref="sheet"
    >
      <template #header>
        <div class="sheet-header">
          <span class="sheet-title">{{ sheetTitle }}</span>
          <!-- 地圖本身的版權標示會被面板蓋住,OpenStreetMap 要求看得到,所以放在這裡 -->
          <a
            class="sheet-attribution"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener"
          >
            © OpenStreetMap
          </a>
          <!-- 載入中:放在標題列(不會跟著列表捲走),而且脫離版面流,不會把卡片推下去 -->
          <v-progress-linear
            v-if="listLoading"
            class="sheet-loading"
            color="primary"
            absolute
            location="bottom"
            indeterminate
            height="2"
          />
        </div>
      </template>
      <PlaceList
        v-bind="listProps"
        vertical
        @focus-card="handleFocusCard"
        @toggle-favorite="handleToggleFavorite"
      />
    </PlaceSheet>
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

/* 觸控裝置沒有縮放按鈕,搜尋框和標籤靠左就好 */
@media (pointer: coarse) {
  .map-search {
    left: 12px;
    width: calc(100% - 24px);
  }
  .map-filter {
    left: 12px;
  }
}

.sheet-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.sheet-title {
  font-size: 15px;
  font-weight: 500;
}
.sheet-attribution {
  flex-shrink: 0;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.6);
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

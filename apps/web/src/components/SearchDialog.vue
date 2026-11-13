<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import {
  mdiArrowLeft,
  mdiMagnify,
  mdiMapMarkerOutline,
  mdiMapMarkerRadiusOutline,
  mdiMapSearchOutline,
} from '@mdi/js'
import type { PlaceSummary, SearchArea } from '@travel/shared'
import { useSearch } from '@/composables/useSearch'

// 觸控裝置用的搜尋:地圖上只放一個看起來像輸入框的按鈕,點了開全螢幕的搜尋頁。
// 手機的鍵盤會佔掉半個畫面,行內的下拉選單要閃避鍵盤、還會讓地圖跟著縮放重查;
// 全螢幕頁面自己排版,不會碰到地圖。滑鼠裝置用 SearchBox。
const emit = defineEmits<{
  'select-place': [place: PlaceSummary]
  'select-area': [area: SearchArea]
}>()

// 還沒輸入時給的範例:點了直接搜尋。都是實際搜得到結果的關鍵字
const EXAMPLES = ['九份', '阿里山', '臺南', '日月潭', '淡水']

const open = ref(false)
const { query, results, loading, error } = useSearch()

const hasResults = computed(() => results.value.areas.length > 0 || results.value.places.length > 0)

// 「找不到」要等這次輸入的搜尋真的回來才顯示:useSearch 有 300ms 的等待,
// 這段時間 loading 還是 false、結果是空的,直接顯示會每打一個字就閃一下
const settled = ref(false)
watch(query, () => (settled.value = false))
watch(loading, (now, before) => {
  if (before && !now) settled.value = true
})
const hasQuery = computed(() => query.value.trim() !== '')
const showNoData = computed(
  () =>
    query.value.trim() !== '' &&
    settled.value &&
    !loading.value &&
    !error.value &&
    !hasResults.value,
)

// iOS 只有在使用者手勢「當下、同步」聚焦輸入框才會彈出鍵盤。對話框裡的輸入框要等渲染才存在,
// 來不及。所以點擊時先聚焦一個一直在 DOM 裡的隱藏輸入框把鍵盤叫出來,
// 對話框的輸入框出現並聚焦之後,鍵盤會直接接過去、不會收起
const focusProxy = useTemplateRef<HTMLInputElement>('focusProxy')

const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

async function openSearch() {
  focusProxy.value?.focus({ preventScroll: true })
  open.value = true
  // 輸入框一渲染就聚焦。Vuetify 在對話框開完之後,如果發現焦點不在裡面,會把焦點放到容器上
  // (不能輸入的元素),iOS 的鍵盤就會收起來。焦點先在裡面,它就不會動
  await nextTick()
  searchInput.value?.focus({ preventScroll: true })
}

// 點範例:填入並搜尋。要馬上把焦點放回輸入框,不然點到的按鈕會搶走焦點,手機鍵盤就收起來了
function useExample(keyword: string) {
  query.value = keyword
  searchInput.value?.focus({ preventScroll: true })
}

function close() {
  open.value = false
}

// 選完就收鍵盤(輸入框失焦),不用等對話框的離場動畫結束、輸入框被移除才收
function pick(emitSelect: () => void) {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  close()
  emitSelect()
}

// 搜尋頁關掉之後清空,下次打開是乾淨的
function reset() {
  query.value = ''
}
</script>

<template>
  <div>
    <button
      type="button"
      class="search-trigger"
      @click="openSearch"
    >
      <v-icon
        :icon="mdiMagnify"
        size="22"
      />
      <span>搜尋景點、縣市、鄉鎮</span>
    </button>

    <input
      ref="focusProxy"
      class="focus-proxy"
      type="text"
      tabindex="-1"
      aria-hidden="true"
    />

    <v-dialog
      v-model="open"
      fullscreen
      :transition="false"
      @after-leave="reset"
    >
      <v-card
        class="search-page"
        rounded="0"
      >
        <div class="search-bar">
          <v-btn
            :icon="mdiArrowLeft"
            variant="text"
            aria-label="返回"
            @click="close"
          />
          <v-text-field
            ref="searchInput"
            v-model="query"
            clearable
            hide-details
            density="comfortable"
            variant="solo-filled"
            flat
            placeholder="搜尋景點、縣市、鄉鎮"
            enterkeyhint="search"
          />
        </div>
        <v-progress-linear
          :active="loading"
          indeterminate
          color="primary"
          height="2"
        />

        <div class="search-results">
          <div
            v-if="!hasQuery"
            class="search-guide"
          >
            <v-icon
              :icon="mdiMapSearchOutline"
              size="56"
            />
            <p class="search-guide-title">想去哪裡玩?</p>
            <p>輸入景點名稱,或縣市、鄉鎮</p>
            <div class="search-examples">
              <v-chip
                v-for="keyword in EXAMPLES"
                :key="keyword"
                variant="tonal"
                @pointerdown.prevent
                @click="useExample(keyword)"
              >
                {{ keyword }}
              </v-chip>
            </div>
          </div>
          <v-list v-if="hasResults">
            <template v-if="results.areas.length">
              <v-list-subheader>地區</v-list-subheader>
              <v-list-item
                v-for="area in results.areas"
                :key="`area:${area.city}:${area.town ?? ''}`"
                :title="`${area.city}${area.town ?? ''}`"
                :subtitle="`${area.count} 個景點`"
                @click="pick(() => emit('select-area', area))"
              >
                <template #prepend>
                  <v-icon :icon="mdiMapMarkerRadiusOutline" />
                </template>
              </v-list-item>
            </template>
            <template v-if="results.places.length">
              <v-list-subheader>景點</v-list-subheader>
              <v-list-item
                v-for="place in results.places"
                :key="`place:${place.id}`"
                :title="place.name"
                :subtitle="`${place.city} ${place.town}`"
                @click="pick(() => emit('select-place', place))"
              >
                <template #prepend>
                  <v-icon :icon="mdiMapMarkerOutline" />
                </template>
              </v-list-item>
            </template>
          </v-list>
          <p
            v-else-if="error"
            class="search-hint"
          >
            搜尋失敗,請稍後再試
          </p>
          <p
            v-else-if="showNoData"
            class="search-hint"
          >
            找不到符合的景點或地區
          </p>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* 長得像 SearchBox 的輸入框,但其實是按鈕 */
.search-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.6);
  box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
  font-size: 16px;
  text-align: left;
}

/* 不能 display: none(隱藏的元素不能聚焦)。字級 16px 以上,iOS 才不會聚焦時自動放大畫面 */
.focus-proxy {
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  opacity: 0;
  font-size: 16px;
  pointer-events: none;
}

.search-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 8px 8px 4px;
}
/* 結果多的時候在這裡捲動,上面的輸入框固定不動 */
.search-results {
  flex: 1;
  overflow-y: auto;
}
/* 還沒輸入:安靜的灰色說明,靠上放(鍵盤會佔掉下半部,置中會被蓋住) */
.search-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 48px 24px 0;
  text-align: center;
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.search-guide p {
  margin: 0;
}
.search-guide-title {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.87);
}
.search-examples {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.search-hint {
  padding: 24px 16px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>

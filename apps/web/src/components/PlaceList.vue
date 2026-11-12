<script setup lang="ts">
import { mdiMapMarkerOffOutline } from '@mdi/js'
import type { PlaceSummary } from '@travel/shared'
import PlaceCard from './PlaceCard.vue'

interface Props {
  places: PlaceSummary[]
  loading: boolean
  // 範圍內沒有景點(不含載入中、載入失敗)
  empty: boolean
  // 有地區篩選時的地區名稱;空狀態會改成說明是篩選造成的
  areaLabel: string | null
  selectedId: string | null
  // 一律直向排列(放在 bottom sheet 裡)。預設是窄螢幕橫向、寬螢幕直向
  vertical?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'focus-card': [id: string]
  'toggle-favorite': [id: string]
  'hover-card': [id: string | null]
}>()
</script>

<template>
  <div
    class="place-list"
    :class="{ 'is-empty': props.empty, 'is-vertical': props.vertical }"
  >
    <!-- absolute:脫離版面流。放在流裡的話,出現/消失會把所有卡片推下去再彈回來 -->
    <v-progress-linear
      v-if="props.loading && !props.vertical"
      class="place-loading"
      color="primary"
      absolute
      indeterminate
    />
    <div
      v-if="props.empty"
      class="place-empty"
    >
      <v-icon
        :icon="mdiMapMarkerOffOutline"
        size="40"
      />
      <template v-if="props.areaLabel">
        <p class="place-empty-title">目前畫面內沒有{{ props.areaLabel }}的景點</p>
        <p>點地圖上的標籤可回到該區</p>
      </template>
      <template v-else>
        <p class="place-empty-title">這個範圍內沒有景點</p>
        <p>試試移動或縮小地圖</p>
      </template>
    </div>
    <PlaceCard
      v-for="place in props.places"
      :key="place.id"
      class="place-card"
      :place="place"
      :selected="place.id === props.selectedId"
      :data-id="place.id"
      @hover-card="emit('hover-card', $event)"
      @focus-card="emit('focus-card', $event)"
      @toggle-favorite="emit('toggle-favorite', $event)"
    />
  </div>
</template>

<style scoped>
.place-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 空狀態:在列表區域正中間,用安靜的灰色,不要做成色塊 */
.place-list.is-empty {
  min-height: 100%;
  align-items: center;
  justify-content: center;
}
.place-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
/* Vuetify 預設會給 p 一個下邊距 */
.place-empty p {
  margin: 0;
}
.place-empty-title {
  font-size: 16px;
  font-weight: 500;
}

/* 直向列表的卡片高度由內容決定。卡片預設的 height: 100% 在 bottom sheet 裡會變成
   「所有卡片平分列表高度」,名稱一長下面的按鈕就被切掉 */
.place-list.is-vertical .place-card {
  height: auto;
  flex-shrink: 0;
}
/* 名稱想多長就多長(橫向列表的卡片高度固定,維持兩行上限) */
.place-list.is-vertical .place-card :deep(.name) {
  display: block;
  line-clamp: unset;
  -webkit-line-clamp: unset;
  overflow: visible;
}

/* scrollIntoView 把卡片貼到捲動區上緣時,留一點空間給卡片的陰影和選取外框 */
.place-list.is-vertical .place-card {
  scroll-margin-top: 12px;
}

@media (max-width: 1024px) {
  .place-list:not(.is-vertical) {
    flex-direction: row;
    width: max-content;
    height: 100%;
  }
  /* 橫排時空狀態要撐滿整個列表寬度才置得到中間 */
  .place-list:not(.is-vertical).is-empty {
    width: 100%;
  }
  .place-list:not(.is-vertical) .place-card {
    width: 280px;
    flex-shrink: 0;
    height: 100%;
  }
}
</style>

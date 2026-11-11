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
    :class="{ 'is-empty': props.empty }"
  >
    <v-progress-linear
      v-if="props.loading"
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

@media (max-width: 1024px) {
  .place-list {
    flex-direction: row;
    width: max-content;
    height: 100%;
  }
  /* 橫排時空狀態要撐滿整個列表寬度才置得到中間 */
  .place-list.is-empty {
    width: 100%;
  }
  .place-card {
    width: 280px;
    flex-shrink: 0;
    height: 100%;
  }
  /* 載入條在橫排裡也當成一格,寬度和卡片一樣 */
  .place-list > :not(.place-card) {
    flex: 0 0 280px;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlaceSummary } from '@travel/shared'
import PlaceCard from './PlaceCard.vue'

interface Props {
  places: PlaceSummary[]
  total: number
  loading: boolean
  error: Error | null
  selectedId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'focus-card': [id: string]
  'toggle-favorite': [id: string]
  'hover-card': [id: string | null]
}>()

const notice = computed(() => {
  if (props.error) return '載入失敗,請稍後再試'
  if (props.loading) return null
  if (props.places.length === 0) return '這個範圍內沒有景點'
  if (props.total > props.places.length) {
    return `此範圍共有 ${props.total} 個景點,目前顯示 ${props.places.length} 個,放大地圖可查看更多`
  }
  return null
})
</script>

<template>
  <div class="place-list">
    <v-progress-linear
      v-if="props.loading"
      indeterminate
    />
    <v-alert
      v-if="notice"
      :type="error ? 'error' : 'info'"
      variant="tonal"
      :text="notice"
    />
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

@media (max-width: 1024px) {
  .place-list {
    flex-direction: row;
    width: max-content;
    height: 100%;
  }
  .place-card {
    width: 280px;
    flex-shrink: 0;
    height: 100%;
  }
  /* 載入條、提示訊息在橫排裡也當成一格,寬度和卡片一樣,高度不要被拉滿 */
  .place-list > :not(.place-card) {
    flex: 0 0 280px;
    align-self: flex-start;
  }
}
</style>

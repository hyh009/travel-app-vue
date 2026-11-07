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
  'select-card': [id: string]
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
  <div class="d-flex flex-column ga-3">
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
      :place="place"
      :selected="place.id === props.selectedId"
      :data-id="place.id"
      @select-card="emit('select-card', $event)"
      @hover-card="emit('hover-card', $event)"
      @focus-card="emit('focus-card', $event)"
      @toggle-favorite="emit('toggle-favorite', $event)"
    />
  </div>
</template>

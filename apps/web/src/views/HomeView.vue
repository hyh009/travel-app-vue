<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { type PlacesQuery } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'

const bounds = ref<PlacesQuery | null>(null)
const selectedId = ref<string | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listContainer')
const mapRef = useTemplateRef<InstanceType<typeof PlaceMap>>('placeMap')

function handleBoundsChange(value: PlacesQuery) {
  bounds.value = value
}

function handleSelectIdChange(id: string) {
  selectedId.value = id
}

function handleFocusCard(id: string) {
  selectedId.value = id
  const targetPlace = data.value?.places.find((p) => p.id === id)
  if (!targetPlace) return
  mapRef.value?.flyTo(targetPlace.lat, targetPlace.lng)
}

const { data, loading, error } = usePlaces(bounds)

function scrollToSelected(options?: ScrollIntoViewOptions) {
  const id = selectedId.value
  const el = id ? listRef.value?.querySelector(`[data-id="${CSS.escape(id)}"]`) : null
  if (el) el.scrollIntoView(options)
  else listRef.value?.scrollTo({ top: 0 })
}

// 資料換了之後:flush: 'post' 代表 DOM 已更新,不用 nextTick
watch(
  data,
  (value) => {
    if (selectedId.value && !value?.places.some((p) => p.id === selectedId.value)) {
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
    >
      <PlaceList
        :places="data?.places ?? []"
        :total="data?.total ?? 0"
        :loading="loading"
        :error="error"
        :selected-id="selectedId"
        @select-card="handleSelectIdChange"
        @focus-card="handleFocusCard"
      />
    </div>
    <div class="map-container">
      <PlaceMap
        ref="placeMap"
        :places="data?.places ?? []"
        :selected-id="selectedId"
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
}
</style>

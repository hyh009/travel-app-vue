<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import type { PlacesQuery } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'

const bounds = ref<PlacesQuery | null>(null)
const selectedId = ref<string | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listContainer')

function handleBoundsChange(value: PlacesQuery) {
  bounds.value = value
}

function handleSelectIdChange(value: string) {
  selectedId.value = value
}

const { data, loading, error } = usePlaces(bounds)

watch(data, () => {
  listRef?.value?.scrollTo({ top: 0 })
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
      />
    </div>
    <div class="map-container">
      <PlaceMap
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

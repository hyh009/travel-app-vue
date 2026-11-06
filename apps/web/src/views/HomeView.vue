<script setup lang="ts">
import { ref } from 'vue'
import type { PlacesQuery } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'

const bounds = ref<PlacesQuery | null>(null)
const selectedId = ref<string | null>(null)

function handleBoundsChange(value: PlacesQuery) {
  bounds.value = value
}

function handleSelectIdChange(value: string) {
  selectedId.value = value
}

const { data, loading, error } = usePlaces(bounds)
</script>
<template>
  <v-container>
    <div style="height: 400px">
      <PlaceMap
        :places="data?.places ?? []"
        :selected-id="selectedId"
        @bounds-change="handleBoundsChange"
        @select="handleSelectIdChange"
      />
    </div>
    <PlaceList
      :places="data?.places ?? []"
      :total="data?.total ?? 0"
      :loading="loading"
      :error="error"
    />
  </v-container>
</template>

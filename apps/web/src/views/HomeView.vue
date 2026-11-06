<script setup lang="ts">
import { ref } from 'vue'
import type { PlacesQuery } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'

const bounds = ref<PlacesQuery | null>(null)

function handleBoundsChange(value: PlacesQuery) {
  bounds.value = value
}
const { data, loading, error } = usePlaces(bounds)
</script>
<template>
  <v-container>
    <div style="height: 400px">
      <PlaceMap
        @bounds-change="handleBoundsChange"
        :places="data?.places ?? []"
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

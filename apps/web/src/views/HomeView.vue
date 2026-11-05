<script setup lang="ts">
import { ref } from 'vue'
import type { PlacesQuery } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'

const bounds = ref<PlacesQuery | null>({
  swLat: 25.03,
  swLng: 121.55,
  neLat: 25.05,
  neLng: 121.58,
})

const { data, loading, error } = usePlaces(bounds)
</script>
<template>
  <v-container>
    <PlaceList
      :places="data?.places ?? []"
      :total="data?.total ?? 0"
      :loading="loading"
      :error="error"
    />
  </v-container>
</template>

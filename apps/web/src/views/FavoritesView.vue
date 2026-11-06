<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { FavoritesResponse } from '@travel/shared'
import { fetchFavorites } from '@/services/favorite.service'
import { errorMessage } from '@/utils/errorMessages'

const data = ref<FavoritesResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    data.value = await fetchFavorites({ page: 1, pageSize: 20 })
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container max-width="900">
    <h1 class="text-h5 mb-4">我的收藏</h1>
    <v-progress-linear
      v-if="loading"
      indeterminate
    />
    <div
      v-else-if="error"
      class="text-error"
    >
      {{ error }}
    </div>
    <div v-else-if="data?.places.length === 0">還沒有收藏</div>
    <v-list v-else>
      <v-list-item
        v-for="place in data?.places"
        :key="place.id"
        :title="place.name"
        :subtitle="`${place.city} ${place.town}`"
      />
    </v-list>
  </v-container>
</template>

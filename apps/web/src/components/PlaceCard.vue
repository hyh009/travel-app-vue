<script setup lang="ts">
import { mdiHeart, mdiHeartOutline } from '@mdi/js'
import type { PlaceSummary } from '@travel/shared'

interface Props {
  place: PlaceSummary
}

const props = defineProps<Props>()
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>{{ props.place.name }}</v-card-title>
      <v-card-subtitle>{{ props.place.city }}{{ props.place.town }}</v-card-subtitle>
      <template #append>
        <v-icon
          :icon="place.isFavorite ? mdiHeart : mdiHeartOutline"
          :color="place.isFavorite ? 'red' : undefined"
        />
      </template>
    </v-card-item>
    <v-card-text>
      <v-chip
        size="small"
        :color="place.isFree ? 'success' : undefined"
      >
        {{ place.isFree ? '免費' : '收費' }}
      </v-chip>
    </v-card-text>
  </v-card>
</template>

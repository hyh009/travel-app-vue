<script setup lang="ts">
import { computed, watch } from 'vue'
import PlaceCard from '@/components/PlaceCard.vue'
import { useFavorites } from '@/composables/useFavorites'
import { useFavoriteMutation } from '@/composables/useFavoriteMutation'
import { errorMessage } from '@/utils/errorMessages'

const { data, loading, error, page, setFavorite } = useFavorites()
const { toggleFavorite } = useFavoriteMutation(setFavorite)

const totalPages = computed(() =>
  data.value ? Math.ceil(data.value.total / data.value.pageSize) : 0,
)

// 換頁後回到頁面頂端,不然新的一頁會從中間開始看
watch(page, () => window.scrollTo({ top: 0 }))
</script>

<template>
  <v-container max-width="1100">
    <h1 class="text-h5 mb-4">我的收藏</h1>

    <v-progress-linear
      v-if="loading"
      indeterminate
    />
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      :text="errorMessage(error)"
    />

    <div
      v-else-if="data && data.total === 0"
      class="text-medium-emphasis"
    >
      還沒有收藏,去地圖上逛逛吧
    </div>

    <template v-else-if="data">
      <v-row>
        <v-col
          v-for="place in data.places"
          :key="place.id"
          cols="12"
          sm="6"
          md="4"
        >
          <!-- 取消收藏後卡片先留著(只是淡化),重新按愛心可以反悔;換頁才會真的消失 -->
          <PlaceCard
            class="h-100"
            :class="{ unfavorited: !place.isFavorite }"
            :place="place"
            :show-focus="false"
            @toggle-favorite="toggleFavorite(place)"
          />
        </v-col>
      </v-row>

      <v-pagination
        v-if="totalPages > 1"
        v-model="page"
        class="mt-6"
        :length="totalPages"
      />
    </template>
  </v-container>
</template>

<style scoped>
.unfavorited {
  opacity: 0.5;
}
</style>

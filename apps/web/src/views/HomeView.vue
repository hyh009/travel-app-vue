<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted } from 'vue'
import { type PlacesQuery } from '@travel/shared'
import PlaceList from '@/components/PlaceList.vue'
import { usePlaces } from '@/composables/usePlaces'
import PlaceMap from '@/components/PlaceMap.vue'
import { useFavoriteMutation } from '@/composables/useFavoriteMutation'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useRouter, useRoute } from 'vue-router'
import { ROUTE_NAME } from '@/router/utils'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const bounds = ref<PlacesQuery | null>(null)
const selectedId = ref<string | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listContainer')
const mapRef = useTemplateRef<InstanceType<typeof PlaceMap>>('placeMap')
const hoveredId = ref<string | null>(null)

const { data, loading, error, setFavorite } = usePlaces(bounds, () => auth.user?.id)
const { toggleFavorite, changeFavorite } = useFavoriteMutation(setFavorite)

function handleBoundsChange(value: PlacesQuery) {
  bounds.value = value
}

function handleSelectIdChange(id: string) {
  selectedId.value = id
}

function handleHoverIdChange(id: string | null) {
  hoveredId.value = id
}

function handleFocusCard(id: string) {
  selectedId.value = id
  const targetPlace = data.value?.places.find((p) => p.id === id)
  if (!targetPlace) return
  mapRef.value?.flyTo(targetPlace.lat, targetPlace.lng)
}

function scrollToSelected(options?: ScrollIntoViewOptions) {
  const id = selectedId.value
  const el = id ? listRef.value?.querySelector(`[data-id="${CSS.escape(id)}"]`) : null
  if (el) el.scrollIntoView(options)
  else listRef.value?.scrollTo({ top: 0 })
}

function handleToggleFavorite(attractionId: string) {
  if (!auth.isLoggedIn) {
    toast.show('請先登入才能收藏', 'info')
    const redirect = router.resolve({
      name: ROUTE_NAME.HOME,
      query: { favorite: attractionId },
    }).fullPath
    router.push({ name: ROUTE_NAME.LOGIN, query: { redirect } })
    return
  }
  if (!data.value) return
  const targetPlace = data.value.places.find((p) => p.id === attractionId)
  if (!targetPlace) return
  toggleFavorite(targetPlace)
}

onMounted(async () => {
  const id = route.query.favorite
  if (typeof id !== 'string' || !auth.isLoggedIn) return

  if (await changeFavorite(id, true)) toast.show('已加入收藏', 'success')
  router.replace({ query: {} })
})

// 景點清單換了之後:flush: 'post' 代表 DOM 已更新,不用 nextTick
// 監聽 id 組成的字串而不是 data 本身:按愛心也會換掉 data 物件,但清單沒變,不該捲動列表
watch(
  () => data.value?.places.map((p) => p.id).join(','),
  () => {
    if (selectedId.value && !data.value?.places.some((p) => p.id === selectedId.value)) {
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
        @hover-card="handleHoverIdChange"
        @focus-card="handleFocusCard"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
    <div class="map-container">
      <PlaceMap
        ref="placeMap"
        :places="data?.places ?? []"
        :selected-id="selectedId"
        :hovered-id="hoveredId"
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

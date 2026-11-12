<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { mdiMagnify, mdiMapMarkerOutline, mdiMapMarkerRadiusOutline } from '@mdi/js'
import type { PlaceSummary, SearchArea } from '@travel/shared'
import { useSearch } from '@/composables/useSearch'

const emit = defineEmits<{
  'select-place': [place: PlaceSummary]
  'select-area': [area: SearchArea]
  // 輸入框取得焦點(手機會彈出鍵盤)
  focus: []
}>()

const { query, results, loading } = useSearch()

// 下拉選單的每一項:分組標題、地區、景點。value 要唯一,Vuetify 用它辨識選了哪一項
type Item =
  | { type: 'subheader'; title: string }
  | { title: string; value: string; kind: 'area'; area: SearchArea }
  | { title: string; value: string; kind: 'place'; place: PlaceSummary }

const items = computed<Item[]>(() => {
  const { areas, places } = results.value
  const list: Item[] = []
  if (areas.length) {
    list.push({ type: 'subheader', title: '地區' })
    for (const area of areas) {
      list.push({
        title: `${area.city}${area.town ?? ''}`,
        value: `area:${area.city}:${area.town ?? ''}`,
        kind: 'area',
        area,
      })
    }
  }
  if (places.length) {
    list.push({ type: 'subheader', title: '景點' })
    for (const place of places) {
      list.push({ title: place.name, value: `place:${place.id}`, kind: 'place', place })
    }
  }
  return list
})

// 還沒輸入、或還在等結果時,不要顯示「沒有資料」
const hasQuery = computed(() => query.value.trim() !== '')

const autocomplete = useTemplateRef('autocomplete')

function handleSelect(item: Item | null) {
  if (!item || !('kind' in item)) return
  // 選完之後收起鍵盤:input 失焦,手機的鍵盤就會跟著消失。
  // 不能馬上 blur:選單關閉時 Vuetify 會把焦點還給輸入框,所以等它還完再失焦
  setTimeout(() => autocomplete.value?.blur(), 0)
  if (item.kind === 'area') emit('select-area', item.area)
  else emit('select-place', item.place)
}
</script>

<template>
  <v-autocomplete
    ref="autocomplete"
    v-model:search="query"
    :model-value="null"
    :items="items"
    :loading="loading"
    :hide-no-data="!hasQuery || loading"
    :prepend-inner-icon="mdiMagnify"
    return-object
    no-filter
    auto-select-first
    hide-details
    hide-selected
    clearable
    density="compact"
    variant="solo"
    placeholder="搜尋景點、縣市、鄉鎮"
    no-data-text="找不到符合的景點或地區"
    :menu-icon="''"
    class="search-box"
    @update:model-value="handleSelect"
    @focus="emit('focus')"
  >
    <template #item="{ item, props: itemProps }">
      <!-- 分組標題由 Vuetify 自己畫;只有地區和景點走到這裡 -->
      <v-list-item
        v-if="'kind' in item"
        v-bind="itemProps"
        :title="item.title"
        :subtitle="
          item.kind === 'place'
            ? `${item.place.city} ${item.place.town}`
            : `${item.area.count} 個景點`
        "
      >
        <template #prepend>
          <v-icon :icon="item.kind === 'area' ? mdiMapMarkerRadiusOutline : mdiMapMarkerOutline" />
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

import { ref, computed, readonly } from 'vue'
import type { SearchArea } from '@travel/shared'

export function useAreaFilter() {
  const areaFilter = ref<SearchArea | null>(null)
  // 標籤和空狀態都要顯示的地區名稱,例如「新北市永和區」
  const areaLabel = computed(
    () => areaFilter.value && `${areaFilter.value.city}${areaFilter.value.town ?? ''}`,
  )

  function clearAreaFilter() {
    areaFilter.value = null
  }

  function setArea(value: SearchArea) {
    areaFilter.value = value
  }

  return { areaFilter: readonly(areaFilter), areaLabel, clearAreaFilter, setArea }
}

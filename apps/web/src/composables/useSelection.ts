import { ref, readonly } from 'vue'

export function useSelection() {
  const selectedId = ref<string | null>(null)
  const hoveredId = ref<string | null>(null)

  function setSelectId(id: string | null) {
    selectedId.value = id
  }

  function setHoverId(id: string | null) {
    hoveredId.value = id
  }

  return {
    selectedId: readonly(selectedId),
    setSelectId,
    hoveredId: readonly(hoveredId),
    setHoverId,
  }
}

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import BottomSheet from '@douxcode/vue-spring-bottom-sheet'
import '@douxcode/vue-spring-bottom-sheet/dist/style.css'

// 收合 / 半開 / 全開。數字是 px,字串是容器高度的百分比。
// 全開只到 80%:要留出上緣的 header 和搜尋框
const SNAP_POINTS = [96, '50%', '80%'] as const
const SNAP_INDEX = { peek: 0, half: 1, full: 2 } as const
export type SheetSnap = keyof typeof SNAP_INDEX

const sheet = useTemplateRef<InstanceType<typeof BottomSheet>>('sheet')

function snapTo(snap: SheetSnap) {
  sheet.value?.snapToPoint(SNAP_INDEX[snap])
}

// 套件把面板傳送到 body,捲動的是它自己的 [data-vsbs-scroll] 區域,不是外面的任何容器
function scrollToTop() {
  document.querySelector('[data-vsbs-scroll]')?.scrollTo({ top: 0 })
}

defineExpose({ snapTo, scrollToTop })
</script>

<template>
  <!-- 常駐在地圖下方的面板:一直是打開的、不能滑掉、不擋住地圖 -->
  <BottomSheet
    ref="sheet"
    :model-value="true"
    :snap-points="[...SNAP_POINTS]"
    :initial-snap-point="SNAP_INDEX.half"
    :blocking="false"
    :can-swipe-close="false"
    :can-backdrop-close="false"
  >
    <template #header>
      <slot name="header" />
    </template>
    <slot />
  </BottomSheet>
</template>

<style>
/* 套件把面板傳送到 body,而且沒有設 z-index:要蓋過 Leaflet 的控制項(1000),
   但要在搜尋框、篩選標籤(1001)和 Vuetify 的下拉選單(2000)下面。
   寬度也不要被套件預設的 640px 限制住 */
[data-vsbs-sheet] {
  z-index: 1000;
  max-width: none !important;
}
/* 標題列要能當定位基準:載入條貼在標題列的底邊(列表的正上方) */
[data-vsbs-header] {
  position: relative;
}
</style>

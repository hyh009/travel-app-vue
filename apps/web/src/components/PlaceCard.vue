<script setup lang="ts">
import { mdiHeart, mdiHeartOutline, mdiMapMarkerOutline, mdiCrosshairsGps } from '@mdi/js'
import type { PlaceSummary } from '@travel/shared'

interface Props {
  place: PlaceSummary
  selected?: boolean
  showFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), { showFocus: true })

const emit = defineEmits<{
  'focus-card': [id: string]
  'toggle-favorite': [id: string]
  'hover-card': [id: string | null]
}>()
</script>

<template>
  <article
    class="card"
    :class="{ selected: props.selected }"
    @mouseenter="emit('hover-card', place.id)"
    @mouseleave="emit('hover-card', null)"
  >
    <!-- 還沒有景點圖片,先用漸層色塊佔位 -->
    <div class="cover">
      <span
        class="badge"
        :class="[place.isFree ? 'free' : 'paid']"
      >
        {{ place.isFree ? '免費' : '收費' }}
      </span>
      <div class="actions">
        <button
          v-if="showFocus"
          class="focus-btn"
          type="button"
          aria-label="在地圖上顯示"
          @click="emit('focus-card', place.id)"
          @focus="emit('hover-card', place.id)"
          @blur="emit('hover-card', null)"
        >
          <v-icon
            :icon="mdiCrosshairsGps"
            size="20"
          />
        </button>
        <button
          class="heart"
          :class="{ active: place.isFavorite }"
          type="button"
          :aria-label="place.isFavorite ? '取消收藏' : '加入收藏'"
          @click="emit('toggle-favorite', place.id)"
        >
          <v-icon
            :icon="place.isFavorite ? mdiHeart : mdiHeartOutline"
            size="20"
          />
        </button>
      </div>
    </div>

    <div class="body">
      <h3 class="name">{{ place.name }}</h3>
      <p class="location">
        <v-icon
          :icon="mdiMapMarkerOutline"
          size="16"
        />
        {{ place.city }}{{ place.town }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 10px;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  /* 用 outline 而不是 border:選取時不會改變卡片尺寸,列表不會跳動 */
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition:
    outline-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}

.card.selected {
  outline-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
  box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.3);
}

/* 底部文字區淡淡的主色底 */
.card.selected .body {
  background: rgba(var(--v-theme-primary), 0.18);
}

.cover {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
}

.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  color: white;
}

.badge.free {
  background: rgb(var(--v-theme-success));
}

.badge.paid {
  background: #37474f;
}

.actions {
  position: absolute;
  top: 6px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.heart {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #546e7a;
  border: none;
  cursor: pointer;
}

.heart.active {
  color: #e53935;
}

.focus-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #546e7a;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;
}

.focus-btn:hover {
  background: white;
  transform: scale(1.1);
}

.body {
  padding: 12px;
}

.name {
  margin: 0;
  font-size: 18px;
  letter-spacing: 1px;
}

.location {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.7;
}
</style>

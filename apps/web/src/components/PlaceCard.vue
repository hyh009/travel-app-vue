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
    <div class="inner">
      <!-- 還沒有每個景點自己的照片,先全部用同一張預設圖 -->
      <img
        class="thumb"
        src="/place-cover.webp"
        alt=""
        loading="lazy"
        width="720"
        height="480"
      />

      <div class="content">
        <h3 class="name">{{ place.name }}</h3>
        <p class="location">
          <v-icon
            :icon="mdiMapMarkerOutline"
            size="16"
          />
          {{ place.city }}{{ place.town }}
        </p>

        <div class="meta">
          <span
            class="badge"
            :class="[place.isFree ? 'free' : 'paid']"
          >
            {{ place.isFree ? '免費' : '收費' }}
          </span>
          <div class="actions">
            <button
              v-if="showFocus"
              class="icon-btn"
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
              class="icon-btn heart"
              :class="{ active: place.isFavorite }"
              type="button"
              :aria-label="place.isFavorite ? '取消收藏' : '加入收藏'"
              @click="emit('toggle-favorite', place.id)"
            >
              <v-icon
                :icon="place.isFavorite ? mdiHeart : mdiHeartOutline"
                size="22"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  /* 讓裡面可以依「卡片自己的寬度」切換直式、橫式(手機橫向捲動時卡片較窄) */
  container-type: inline-size;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  /* 用 outline 而不是 border:選取時不會改變卡片尺寸,列表不會跳動 */
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition:
    outline-color 0.15s,
    background-color 0.15s,
    box-shadow 0.15s;
  height: 100%;
}

.card.selected {
  outline-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.07);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
}

/* 預設(卡片夠寬):左圖右文 */
.inner {
  display: flex;
  gap: 14px;
  padding: 12px;
  height: 100%;
}

.thumb {
  flex: none;
  /* 預設圖是 3:2,照比例顯示才不會被裁掉 */
  width: 144px;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.name {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.35;
  /* 名稱很長時最多兩行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.location {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.7;
}

/* margin-top: auto 讓標籤和按鈕固定貼在卡片底部 */
.meta {
  margin-top: auto;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  padding: 2px 12px;
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
  background: rgb(var(--v-theme-info));
}

.actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #546e7a;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;
}
.icon-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  transform: scale(1.08);
}
.heart.active {
  color: #e53935;
}

/* 卡片較窄(手機橫向捲動):照片放上面,文字在下面 */
@container (max-width: 330px) {
  .inner {
    flex-direction: column;
    gap: 10px;
  }
  .thumb {
    width: 100%;
    height: 120px;
    /* 變寬扁後上下會被裁,偏上一點才不會切到圖釘的頂端 */
    object-position: center 30%;
  }
}

@media (pointer: coarse) {
  .icon-btn {
    width: 44px;
    height: 44px;
  }
}
</style>

<script setup lang="ts">
import { mdiHeartOutline, mdiImageFilterHdr, mdiMapMarkerOutline } from '@mdi/js'
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAME } from '@/router/utils'

const auth = useAuthStore()
</script>

<template>
  <v-app-bar color="blue-grey-darken-4">
    <RouterLink
      class="brand"
      :to="{ name: ROUTE_NAME.HOME }"
    >
      <v-icon
        :icon="mdiImageFilterHdr"
        size="32"
      />
      <span class="brand-name">台灣景點</span>
    </RouterLink>

    <nav class="nav">
      <v-btn
        class="nav-btn"
        rounded="pill"
        :prepend-icon="mdiMapMarkerOutline"
        :to="{ name: ROUTE_NAME.HOME }"
      >
        <span class="nav-label">地圖探索</span>
      </v-btn>
      <v-btn
        class="nav-btn"
        rounded="pill"
        :prepend-icon="mdiHeartOutline"
        :to="{ name: ROUTE_NAME.FAVORITES }"
      >
        <span class="nav-label">我的收藏</span>
      </v-btn>
    </nav>

    <template v-if="auth.user">
      <span class="mx-2 d-none d-sm-inline">{{ auth.user.name ?? auth.user.email }}</span>
      <v-btn @click="auth.logout()">登出</v-btn>
    </template>
    <template v-else>
      <v-btn :to="{ name: ROUTE_NAME.LOGIN }">登入</v-btn>
      <v-btn :to="{ name: ROUTE_NAME.REGISTER }">註冊</v-btn>
    </template>
  </v-app-bar>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  /* 跟左邊的距離(原本 v-app-bar-title 替我們做的) */
  margin-inline-start: 20px;
  /* 連結預設的藍色和底線 */
  color: inherit;
  text-decoration: none;
}
.brand-name {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.75rem;
  white-space: nowrap;
}

/* auto margin 把後面的使用者區塊推到最右邊 */
.nav {
  display: flex;
  gap: 4px;
  margin-inline: 24px auto;
}
/* 目前所在的頁面:實心主色膠囊 */
.nav-btn.v-btn--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
/* 沒選到的膠囊淡一點 */
.nav-btn:not(.v-btn--active) {
  opacity: 0.8;
}

@media (max-width: 600px) {
  .brand {
    margin-inline-start: 12px;
    gap: 6px;
  }
  .brand-name {
    font-size: 1.05rem;
  }
  /* 手機只留圖示,文字收起來 */
  .nav {
    margin-inline-start: 8px;
  }
  .nav-label {
    display: none;
  }
  .nav-btn {
    min-width: 0;
    padding-inline: 10px;
  }
  .nav-btn :deep(.v-btn__prepend) {
    margin-inline: 0;
  }
}
</style>

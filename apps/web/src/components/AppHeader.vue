<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAME } from '@/router/utils'

const auth = useAuthStore()
</script>

<template>
  <v-app-bar color="blue-grey-darken-4">
    <RouterLink
      class="app-title"
      :to="{ name: ROUTE_NAME.HOME }"
    >
      台灣景點
    </RouterLink>
    <template v-if="auth.user">
      <v-btn :to="{ name: ROUTE_NAME.FAVORITES }">收藏</v-btn>
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
.app-title {
  /* 以下三行是 v-app-bar-title 原本替我們做的:字體、跟左邊的距離 */
  margin-inline-start: 20px;
  font-size: 1.25rem;
  line-height: 1.75rem;
  /* 把後面的按鈕推到最右邊;用 auto margin 而不是 flex: 1,可以點的範圍才只有文字本身 */
  margin-inline-end: auto;
  /* 連結預設的藍色和底線 */
  color: inherit;
  text-decoration: none;
}
</style>
